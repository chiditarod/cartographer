# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Races', type: :request do
  describe 'GET /api/v1/races' do
    it 'returns all races' do
      FactoryBot.create(:race, name: 'Race Bravo')
      FactoryBot.create(:race, name: 'Race Alpha')

      get '/api/v1/races'
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.size).to eq(2)
      expect(json.first['name']).to eq('Race Alpha')
    end
  end

  describe 'GET /api/v1/races/:id' do
    it 'returns race with details' do
      race = FactoryBot.create(:race, :with_locations)
      get "/api/v1/races/#{race.id}"
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['id']).to eq(race.id)
      expect(json).to have_key('start')
      expect(json).to have_key('finish')
      expect(json).to have_key('locations')
      expect(json).to have_key('leg_count')
    end
  end

  describe 'POST /api/v1/races' do
    it 'creates a race' do
      start_loc = FactoryBot.create(:location)
      finish_loc = FactoryBot.create(:location)

      post '/api/v1/races', params: {
        race: {
          name: 'New Race',
          num_stops: 3,
          max_teams: 50,
          people_per_team: 5,
          min_total_distance: 3.0,
          max_total_distance: 5.0,
          min_leg_distance: 0.5,
          max_leg_distance: 2.0,
          start_id: start_loc.id,
          finish_id: finish_loc.id,
          distance_unit: 'mi',
          location_ids: [start_loc.id, finish_loc.id]
        }
      }
      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json['name']).to eq('New Race')
      expect(json['location_ids']).to include(start_loc.id, finish_loc.id)
    end
  end

  describe 'PATCH /api/v1/races/:id' do
    it 'updates a race' do
      race = FactoryBot.create(:race)
      patch "/api/v1/races/#{race.id}", params: { race: { name: 'Updated Race' } }
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)['name']).to eq('Updated Race')
    end
  end

  describe 'DELETE /api/v1/races/:id' do
    it 'deletes a race' do
      race = FactoryBot.create(:race)
      expect {
        delete "/api/v1/races/#{race.id}"
      }.to change(Race, :count).by(-1)
      expect(response).to have_http_status(:ok)
    end
  end
end
