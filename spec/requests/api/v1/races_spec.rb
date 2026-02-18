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

  describe 'POST /api/v1/races/:id/duplicate' do
    it 'duplicates a race with locations but not routes' do
      race = FactoryBot.create(:race, :with_locations, name: 'Original Race')
      FactoryBot.create(:route, race: race)

      expect {
        post "/api/v1/races/#{race.id}/duplicate"
      }.to change(Race, :count).by(1)

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json['name']).to eq('Copy of Original Race')
      expect(json['num_stops']).to eq(race.num_stops)
      expect(json['start_id']).to eq(race.start_id)
      expect(json['finish_id']).to eq(race.finish_id)
      expect(json['location_ids']).to match_array(race.location_ids)
      expect(json['route_count']).to eq(0)
    end

    it 'duplicates a race with logo' do
      race = FactoryBot.create(:race, name: 'Logo Race')
      race.logo.attach(
        io: StringIO.new(File.binread(Rails.root.join('public', 'mock-route-map.png'))),
        filename: 'logo.png',
        content_type: 'image/png'
      )

      post "/api/v1/races/#{race.id}/duplicate"
      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      copy = Race.find(json['id'])
      expect(copy.logo).to be_attached
      expect(json['logo_url']).to be_present
    end
  end

  describe 'logo upload' do
    it 'uploads a logo with race creation' do
      start_loc = FactoryBot.create(:location)
      finish_loc = FactoryBot.create(:location)
      logo = fixture_file_upload(Rails.root.join('public', 'mock-route-map.png'), 'image/png')

      post '/api/v1/races', params: {
        race: {
          name: 'Logo Race',
          num_stops: 2,
          max_teams: 5,
          people_per_team: 5,
          min_total_distance: 2.5,
          max_total_distance: 3.5,
          min_leg_distance: 0.8,
          max_leg_distance: 1.2,
          start_id: start_loc.id,
          finish_id: finish_loc.id,
          distance_unit: 'mi',
          location_ids: [start_loc.id, finish_loc.id],
          logo: logo
        }
      }
      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json['logo_url']).to be_present
    end

    it 'deletes a logo' do
      race = FactoryBot.create(:race)
      race.logo.attach(
        io: StringIO.new(File.binread(Rails.root.join('public', 'mock-route-map.png'))),
        filename: 'logo.png',
        content_type: 'image/png'
      )
      expect(race.logo).to be_attached

      patch "/api/v1/races/#{race.id}", params: { race: { delete_logo: 'true' } }
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['logo_url']).to be_nil
    end

    it 'returns logo_url in serialization' do
      race = FactoryBot.create(:race)
      get "/api/v1/races/#{race.id}"
      json = JSON.parse(response.body)
      expect(json).to have_key('logo_url')
      expect(json['logo_url']).to be_nil
    end

    it 'rejects invalid file types' do
      race = FactoryBot.create(:race)
      race.logo.attach(
        io: StringIO.new("not an image"),
        filename: 'bad.txt',
        content_type: 'text/plain'
      )
      expect(race).not_to be_valid
      expect(race.errors[:logo]).to include('must be a PNG or JPEG')
    end
  end
end
