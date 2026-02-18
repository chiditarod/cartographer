# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Routes', type: :request do
  let!(:route) { FactoryBot.create(:sequential_route) }
  let(:race) { route.race }

  describe 'GET /api/v1/races/:race_id/routes' do
    it 'returns complete routes for a race' do
      get "/api/v1/races/#{race.id}/routes"
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json).to be_an(Array)
      json.each do |r|
        expect(r['complete']).to be true
      end
    end
  end

  describe 'GET /api/v1/races/:race_id/routes/:id' do
    it 'returns route with legs and map' do
      get "/api/v1/races/#{race.id}/routes/#{route.id}"
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['id']).to eq(route.id)
      expect(json).to have_key('legs')
      expect(json).to have_key('map_url')
      expect(json).to have_key('csv')
    end
  end

  describe 'PATCH /api/v1/races/:race_id/routes/:id' do
    it 'updates route name' do
      patch "/api/v1/races/#{race.id}/routes/#{route.id}",
            params: { route: { name: 'Route Alpha' } }
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)['name']).to eq('Route Alpha')
    end
  end

  describe 'DELETE /api/v1/races/:race_id/routes/:id' do
    it 'deletes a route' do
      expect {
        delete "/api/v1/races/#{race.id}/routes/#{route.id}"
      }.to change(Route, :count).by(-1)
      expect(response).to have_http_status(:ok)
    end
  end
end
