# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Location, type: :model do

  describe 'lat_lng' do
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
