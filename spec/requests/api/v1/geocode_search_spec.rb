# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::GeocodeSearch', type: :request do
  describe 'GET /api/v1/geocode_search' do
    it 'returns 400 when query is missing' do
      get '/api/v1/geocode_search'
      expect(response).to have_http_status(:bad_request)
      json = JSON.parse(response.body)
      expect(json['error']).to eq('Query is required')
    end

    it 'returns 400 when query is blank' do
      get '/api/v1/geocode_search', params: { query: '  ' }
      expect(response).to have_http_status(:bad_request)
    end

    context 'with MOCK_MAP enabled' do
      before { allow(ENV).to receive(:[]).and_call_original }
      before { allow(ENV).to receive(:[]).with('MOCK_MAP').and_return('true') }

      it 'returns mock geocode results' do
        get '/api/v1/geocode_search', params: { query: 'Wrigley Field' }
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json).to be_an(Array)
        expect(json.length).to eq(1)

        result = json.first
        expect(result['formatted_address']).to include('Wrigley Field')
        expect(result['city']).to eq('Chicago')
        expect(result['state']).to eq('IL')
        expect(result['lat']).to be_a(Float)
        expect(result['lng']).to be_a(Float)
      end
    end
  end
end
