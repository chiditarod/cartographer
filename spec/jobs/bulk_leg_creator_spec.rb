# frozen_string_literal: true

require 'rails_helper'

RSpec.describe BulkLegCreator, type: :job do

  describe '#perform' do

    context 'in test_mode' do
      let(:test_mode) { { min: 12000, max: 18000 } }

      it 'creates legs with random distances between all location pairs' do
        locations = FactoryBot.create_list(:location, 3)
        ids = locations.map(&:id)

        expect {
          BulkLegCreator.new.perform(ids, test_mode)
        }.to change(Leg, :count).by(6) # 3 pairs * 2 (mirrors)

        locations.combination(2).each do |a, b|
          expect(Leg.where(start: a, finish: b).or(Leg.where(start: b, finish: a)).count).to eq(2)
        end
      end

      it 'skips preexisting legs' do
        loc_a = FactoryBot.create(:location)
        loc_b = FactoryBot.create(:location)
        Leg.create!(start: loc_a, finish: loc_b, distance: 5000) # also creates mirror

        expect {
          BulkLegCreator.new.perform([loc_a.id, loc_b.id], test_mode)
        }.not_to change(Leg, :count)
      end

      it 'handles empty destination list gracefully' do
        loc = FactoryBot.create(:location)

        expect {
          BulkLegCreator.new.perform([loc.id], test_mode)
        }.not_to change(Leg, :count)
      end

      it 'creates legs with distances within the specified range' do
        locations = FactoryBot.create_list(:location, 2)
        ids = locations.map(&:id)

        BulkLegCreator.new.perform(ids, test_mode)

        Leg.where(start: locations.first, finish: locations.last).each do |leg|
          expect(leg.distance).to be >= test_mode[:min]
          expect(leg.distance).to be < test_mode[:max]
        end
      end
    end

    context 'in API mode' do
      let(:loc_a) { FactoryBot.create(:location) }
      let(:loc_b) { FactoryBot.create(:location) }

      let(:api_response) do
        {
          rows: [
            {
              elements: [
                { distance: { value: 5000 } }
              ]
            }
          ]
        }
      end

      let(:mock_client) { double('GoogleMapsService::Client') }
      let(:mock_api_client) { double('GoogleApiClient', client: mock_client) }

      before do
        allow(GoogleApiClient).to receive(:new).and_return(mock_api_client)
        allow(mock_client).to receive(:distance_matrix).and_return(api_response)
      end

      it 'creates legs from Google API response' do
        expect {
          BulkLegCreator.new.perform([loc_a.id, loc_b.id])
        }.to change(Leg, :count).by(2) # leg + mirror

        leg = Leg.find_by(start: loc_a, finish: loc_b)
        expect(leg.distance).to eq(5000)
      end
    end
  end

  describe '#random_distance' do
    it 'returns a value within min/max range' do
      job = BulkLegCreator.new
      test_mode = { min: 100, max: 200 }

      20.times do
        val = job.send(:random_distance, test_mode)
        expect(val).to be >= 100
        expect(val).to be < 200
      end
    end
  end
end
