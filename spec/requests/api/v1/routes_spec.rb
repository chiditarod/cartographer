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

    it 'includes location_sequence in each route' do
      get "/api/v1/races/#{race.id}/routes"
      json = JSON.parse(response.body)
      json.each do |r|
        expect(r).to have_key('location_sequence')
        expect(r['location_sequence']).to be_an(Array)
        r['location_sequence'].each do |loc|
          expect(loc).to have_key('id')
          expect(loc).to have_key('name')
        end
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

  describe 'GET /api/v1/races/:race_id/routes/export_csv' do
    it 'returns CSV of all complete routes' do
      get "/api/v1/races/#{race.id}/routes/export_csv"
      expect(response).to have_http_status(:ok)
      expect(response.content_type).to include('text/csv')
      expect(response.body).to include('Route ID')
    end

    it 'does not include incomplete routes' do
      incomplete = FactoryBot.create(:route, race: race, complete: false)
      get "/api/v1/races/#{race.id}/routes/export_csv"
      expect(response.body).not_to include(incomplete.id.to_s)
    end
  end

  describe 'GET /api/v1/races/:race_id/routes/export_csv with ids filter' do
    it 'returns CSV for only the specified route ids' do
      route2 = FactoryBot.create(:sequential_route, race: race)
      get "/api/v1/races/#{race.id}/routes/export_csv?ids=#{route.id}"
      expect(response).to have_http_status(:ok)
      expect(response.content_type).to include('text/csv')
      expect(response.body).to include(route.id.to_s)
      expect(response.body).not_to include(route2.id.to_s)
    end
  end

  describe 'DELETE /api/v1/races/:race_id/routes/bulk' do
    it 'deletes only the specified routes' do
      route2 = FactoryBot.create(:sequential_route, race: race)
      expect {
        delete "/api/v1/races/#{race.id}/routes/bulk",
               params: { ids: [route.id] },
               as: :json
      }.to change(Route, :count).by(-1)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['message']).to eq('Deleted 1 routes')
      expect(Route.exists?(route.id)).to be false
      expect(Route.exists?(route2.id)).to be true
    end

    it 'ignores ids not belonging to the race' do
      other_route = FactoryBot.create(:sequential_route)
      expect {
        delete "/api/v1/races/#{race.id}/routes/bulk",
               params: { ids: [other_route.id] },
               as: :json
      }.not_to change(Route, :count)
      expect(response).to have_http_status(:ok)
    end
  end

  describe 'DELETE /api/v1/races/:race_id/routes/all' do
    it 'deletes all routes for the race' do
      FactoryBot.create(:sequential_route, race: race)
      expect(race.routes.count).to be >= 2
      expect {
        delete "/api/v1/races/#{race.id}/routes/all"
      }.to change { race.routes.count }.to(0)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['message']).to match(/Deleted \d+ routes/)
    end
  end
end
