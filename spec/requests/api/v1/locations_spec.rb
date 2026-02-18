# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Locations', type: :request do
  let(:valid_attrs) do
    {
      name: 'Test Location',
      street_address: '123 Main St',
      city: 'Chicago',
      state: 'IL',
      zip: 60601,
      max_capacity: 200,
      ideal_capacity: 150
    }
  end

  describe 'GET /api/v1/locations' do
    it 'returns all locations ordered by name' do
      FactoryBot.create(:location, name: 'Bravo')
      FactoryBot.create(:location, name: 'Alpha')

      get '/api/v1/locations'
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.size).to eq(2)
      expect(json.first['name']).to eq('Alpha')
    end
  end

  describe 'GET /api/v1/locations/:id' do
    it 'returns a location' do
      location = FactoryBot.create(:location)
      get "/api/v1/locations/#{location.id}"
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['id']).to eq(location.id)
      expect(json['name']).to eq(location.name)
      expect(json).to have_key('geocoded')
    end

    it 'returns 404 for missing location' do
      get '/api/v1/locations/999999'
      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'POST /api/v1/locations' do
    it 'creates a location' do
      post '/api/v1/locations', params: { location: valid_attrs }
      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json['name']).to eq('Test Location')
    end

    it 'returns errors for invalid data' do
      post '/api/v1/locations', params: { location: { name: '' } }
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe 'PATCH /api/v1/locations/:id' do
    it 'updates a location' do
      location = FactoryBot.create(:location)
      patch "/api/v1/locations/#{location.id}", params: { location: { name: 'Updated' } }
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)['name']).to eq('Updated')
    end
  end

  describe 'DELETE /api/v1/locations/:id' do
    it 'deletes a location' do
      location = FactoryBot.create(:location)
      expect {
        delete "/api/v1/locations/#{location.id}"
      }.to change(Location, :count).by(-1)
      expect(response).to have_http_status(:ok)
    end
  end
end
