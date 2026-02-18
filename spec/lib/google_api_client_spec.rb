# frozen_string_literal: true

require 'rails_helper'

RSpec.describe GoogleApiClient do

  describe '#initialize' do
    context 'when GOOGLE_API_KEY env var is missing' do
      before do
        stub_const('ENV', ENV.to_hash.merge('GOOGLE_API_KEY' => nil))
      end

      it 'raises an error due to missing API key' do
        expect { GoogleApiClient.new }.to raise_error(StandardError, "GOOGLE_API_KEY env var is required to use Google API")
      end
    end

    context 'when GOOGLE_API_KEY env var is present' do
      before do
        stub_const('ENV', ENV.to_hash.merge('GOOGLE_API_KEY' => 'test-key'))
      end

      it 'creates a client successfully' do
        mock_client = double('GoogleMapsService::Client')
        allow(GoogleMapsService::Client).to receive(:new).and_return(mock_client)

        api_client = GoogleApiClient.new
        expect(api_client.client).to eq(mock_client)
        expect(GoogleMapsService::Client).to have_received(:new).with(
          key: 'test-key',
          retry_timeout: 20,
          queries_per_second: 10
        )
      end
    end
  end
end
