# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Location, type: :model do

  describe 'validations' do
    it 'requires name to be present' do
      loc = FactoryBot.build(:location, name: nil)
      expect(loc).not_to be_valid
      expect(loc.errors[:name]).to include("can't be blank")
    end

    it 'requires name to be unique' do
      FactoryBot.create(:location, name: 'UniquePlace')
      loc = FactoryBot.build(:location, name: 'UniquePlace')
      expect(loc).not_to be_valid
      expect(loc.errors[:name]).to include('has already been taken')
    end

    it 'requires max_capacity to be an integer' do
      loc = FactoryBot.build(:location, max_capacity: 1.5)
      expect(loc).not_to be_valid
      expect(loc.errors[:max_capacity]).to include('must be an integer')
    end

    it 'requires ideal_capacity to be an integer' do
      loc = FactoryBot.build(:location, ideal_capacity: 1.5)
      expect(loc).not_to be_valid
      expect(loc.errors[:ideal_capacity]).to include('must be an integer')
    end

    context 'conditional address validation' do
      it 'is valid with street address fields' do
        loc = FactoryBot.build(:location)
        expect(loc).to be_valid
      end

      it 'is valid with lat/lng instead of street address' do
        loc = FactoryBot.build(:location,
          street_address: nil, city: nil, state: nil, zip: nil,
          lat: 41.8781, lng: -87.6298)
        expect(loc).to be_valid
      end

      it 'is invalid without street address or lat/lng' do
        loc = FactoryBot.build(:location,
          street_address: nil, city: nil, state: nil, zip: nil,
          lat: nil, lng: nil)
        expect(loc).not_to be_valid
      end
    end
  end

  describe '#full_address' do
    it 'returns formatted address string' do
      loc = FactoryBot.build(:location,
        street_address: '123 Main St', city: 'Chicago', state: 'IL', zip: 60601)
      expect(loc.full_address).to eq('123 Main St Chicago IL 60601')
    end
  end

  describe '#to_s' do
    it 'returns the location name' do
      loc = FactoryBot.build(:location, name: 'Test Location')
      expect(loc.to_s).to eq('Test Location')
    end
  end

  describe 'associations' do
    it 'has and belongs to many races' do
      assoc = Location.reflect_on_association(:races)
      expect(assoc.macro).to eq(:has_and_belongs_to_many)
    end
  end

  describe '#lat_lng' do
    context 'when lat and lng are not present' do
      let(:loc) { FactoryBot.build(:location) }
      it 'returns nil' do
        expect(loc.lat_lng).to be_nil
      end
    end

    context 'when one of lat or lng is present' do
      let(:loc) do
        l = FactoryBot.build(:location)
        l.lat = 12345
        l.save
        l
      end
      it 'returns nil' do
        expect(loc.lat_lng).to be_nil
      end
    end

    context 'when lat and lng are both present' do
      let(:loc) { FactoryBot.build(:location, :with_lat_lng) }
      it 'returns comma-separated value' do
        expect(loc.lat_lng).to eq("#{loc.lat},#{loc.lng}")
      end
    end
  end
end
