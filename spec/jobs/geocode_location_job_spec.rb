require 'rails_helper'

RSpec.describe GeocodeLocationJob, type: :job do

  describe '#perform' do
    let(:location) { FactoryBot.create(:location) }

    let(:geocode_response) do
      [{ geometry: { location: { lat: 41.8781, lng: -87.6298 } } }]
    end

    let(:mock_client) { double('GoogleMapsService::Client') }
    let(:mock_api_client) { double('GoogleApiClient', client: mock_client) }

    before do
      allow(GoogleApiClient).to receive(:new).and_return(mock_api_client)
      allow(mock_client).to receive(:geocode).and_return(geocode_response)
    end

    it 'geocodes a location without lat/lng' do
      GeocodeLocationJob.new.perform([location.id])

      location.reload
      expect(location.lat).to eq(41.8781)
      expect(location.lng).to eq(-87.6298)
    end

    it 'skips locations that already have lat/lng' do
      location.update!(lat: 40.0, lng: -88.0)

      GeocodeLocationJob.new.perform([location.id])

      location.reload
      expect(location.lat).to eq(40.0)
      expect(location.lng).to eq(-88.0)
      expect(mock_client).not_to have_received(:geocode)
    end

    it 'processes multiple location IDs' do
      location2 = FactoryBot.create(:location)

      geocode_response2 = [{ geometry: { location: { lat: 42.0, lng: -88.0 } } }]
      call_count = 0
      allow(mock_client).to receive(:geocode) do
        call_count += 1
        call_count == 1 ? geocode_response : geocode_response2
      end

      GeocodeLocationJob.new.perform([location.id, location2.id])

      location.reload
      location2.reload
      expect(location.lat).to eq(41.8781)
      expect(location2.lat).to eq(42.0)
    end
  end
end
