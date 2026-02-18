# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Leg, type: :model do
  let(:test_mode) { {min: 0.3, max: 0.5} }

  describe '#fetch_distance' do
    let(:start_loc) { FactoryBot.create(:location) }
    let(:finish_loc) { FactoryBot.create(:location) }

    let(:api_response) do
      {
        rows: [
          {
            elements: [
              { distance: { value: 3218 } }
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

    it 'fetches distance from Google Maps API and sets it on the leg' do
      leg = Leg.create!(start: start_loc, finish: finish_loc)
      expect(leg.distance).to eq(3218)
      expect(mock_client).to have_received(:distance_matrix)
    end
  end

  describe '#to_s' do
    it 'returns formatted string with start, distance, finish' do
      leg = FactoryBot.build(:leg, distance: 1609)
      result = leg.to_s('mi')
      expect(result).to include(leg.start.name)
      expect(result).to include(leg.finish.name)
      expect(result).to include('mi')
    end
  end

  describe '#to_csv' do
    it 'returns CSV-formatted string' do
      leg = FactoryBot.build(:leg, distance: 1609)
      result = leg.to_csv('mi')
      parts = result.split(',')
      expect(parts[0]).to eq(leg.start.name)
      expect(parts[-1]).to eq(leg.finish.name)
      expect(result).to include('mi')
    end
  end

  describe '.save' do
    let(:start) { FactoryBot.create :location }
    let(:finish) { FactoryBot.create :location }

    it 'creates a mirror leg' do
      expect do
        Leg.create(start: start, finish: finish, distance: 1.0)
      end.to change(Leg, :count).by(2)

      expect(Leg.where(start: start, finish: finish).size).to eq(1)
      expect(Leg.where(start: finish, finish: start).size).to eq(1)
    end

    it 'does not create a mirror leg when one already exists' do
      Leg.create!(start: start, finish: finish, distance: 1.0) # creates mirror too

      expect do
        Leg.create!(start: start, finish: finish, distance: 2.0)
      rescue ActiveRecord::RecordNotUnique
        # unique index prevents duplicate start/finish pair
      end.not_to change(Leg, :count)
    end
  end

  describe 'scopes' do

    describe '#valid_for_race' do

      shared_examples "empty" do
        it "returns empty" do
          expect(Leg.valid_for_race(race)).to be_empty
        end
      end

      context 'when race has no locations' do
        let(:race) { FactoryBot.create :race }
        include_examples "empty"
      end

      context 'when race has locations' do
        let(:race) { FactoryBot.create :race, :with_locations }

        context 'no legs exist' do
          include_examples "empty"
        end

        context 'leg exists with unrelated locations' do
          let!(:leg) { FactoryBot.create :leg }
          include_examples "empty"
        end

        context 'leg exists and start or finish is in race locations but not both' do
          let!(:leg) { FactoryBot.create :leg, start: race.locations.first }
          include_examples "empty"
        end

        context 'leg exists and both start and finish are in race locations' do
          let!(:leg) { FactoryBot.create :leg, start: race.locations.first, finish: race.locations.last }
          it 'includes the leg and its mirror' do
            mirror = Leg.where(start: leg.finish, finish: leg.start).first
            expect(Leg.valid_for_race(race)).to eq([leg, mirror])
          end
        end
      end
    end
  end
end
