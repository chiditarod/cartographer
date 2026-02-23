# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Teams', type: :request do
  let(:race) { FactoryBot.create(:race) }

  describe 'GET /api/v1/races/:race_id/teams' do
    it 'returns all teams for a race ordered by dogtag_id' do
      FactoryBot.create(:team, race: race, dogtag_id: 5, name: 'Bravo')
      FactoryBot.create(:team, race: race, dogtag_id: 1, name: 'Alpha')

      get "/api/v1/races/#{race.id}/teams"
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.size).to eq(2)
      expect(json.first['dogtag_id']).to eq(1)
      expect(json.first).to have_key('display_number')
    end
  end

  describe 'POST /api/v1/races/:race_id/teams' do
    it 'creates a team' do
      post "/api/v1/races/#{race.id}/teams", params: {
        team: { name: 'New Team', dogtag_id: 42 }
      }
      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json['name']).to eq('New Team')
      expect(json['dogtag_id']).to eq(42)
      expect(json['bib_number']).to be_nil
      expect(json['display_number']).to eq(42)
    end
  end

  describe 'PATCH /api/v1/races/:race_id/teams/:id' do
    it 'updates a team' do
      team = FactoryBot.create(:team, race: race, dogtag_id: 1)
      route = FactoryBot.create(:route, race: race)

      patch "/api/v1/races/#{race.id}/teams/#{team.id}", params: {
        team: { route_id: route.id }
      }
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['route_id']).to eq(route.id)
    end

    it 'updates bib_number' do
      team = FactoryBot.create(:team, race: race, dogtag_id: 1)

      patch "/api/v1/races/#{race.id}/teams/#{team.id}", params: {
        team: { bib_number: 99 }
      }
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['bib_number']).to eq(99)
      expect(json['display_number']).to eq(99)
    end
  end

  describe 'DELETE /api/v1/races/:race_id/teams/:id' do
    it 'deletes a team' do
      team = FactoryBot.create(:team, race: race, dogtag_id: 1)
      delete "/api/v1/races/#{race.id}/teams/#{team.id}"
      expect(response).to have_http_status(:ok)
      expect(race.teams.count).to eq(0)
    end

    it 'deletes all teams when id is "all"' do
      FactoryBot.create(:team, race: race, dogtag_id: 1)
      FactoryBot.create(:team, race: race, dogtag_id: 2)

      delete "/api/v1/races/#{race.id}/teams/all"
      expect(response).to have_http_status(:ok)
      expect(race.teams.count).to eq(0)
    end
  end

  describe 'POST /api/v1/races/:race_id/teams/import_csv' do
    it 'imports teams from CSV' do
      csv_content = "number,name\n1,Alpha\n2,Bravo\n"
      file = Rack::Test::UploadedFile.new(
        StringIO.new(csv_content),
        'text/csv',
        original_filename: 'teams.csv'
      )

      post "/api/v1/races/#{race.id}/teams/import_csv", params: { file: file }
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['imported']).to eq(2)
    end

    it 'returns error without file' do
      post "/api/v1/races/#{race.id}/teams/import_csv"
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe 'POST /api/v1/races/:race_id/teams/bulk_assign' do
    it 'assigns teams to routes' do
      route = FactoryBot.create(:route, race: race)
      team1 = FactoryBot.create(:team, race: race, dogtag_id: 1)
      team2 = FactoryBot.create(:team, race: race, dogtag_id: 2)

      post "/api/v1/races/#{race.id}/teams/bulk_assign", params: {
        assignments: [
          { team_id: team1.id, route_id: route.id },
          { team_id: team2.id, route_id: route.id }
        ]
      }
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.all? { |t| t['route_id'] == route.id }).to be true
    end

    it 'clears previous assignments' do
      route = FactoryBot.create(:route, race: race)
      team = FactoryBot.create(:team, race: race, dogtag_id: 1, route: route)

      post "/api/v1/races/#{race.id}/teams/bulk_assign", params: {
        assignments: []
      }
      expect(response).to have_http_status(:ok)
      expect(team.reload.route_id).to be_nil
    end
  end

  describe 'POST /api/v1/races/:race_id/teams/clear_bibs' do
    it 'clears all bib_numbers for a race' do
      FactoryBot.create(:team, race: race, dogtag_id: 1, bib_number: 10)
      FactoryBot.create(:team, race: race, dogtag_id: 2, bib_number: 20)

      post "/api/v1/races/#{race.id}/teams/clear_bibs"
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.all? { |t| t['bib_number'].nil? }).to be true
      expect(json.map { |t| t['display_number'] }).to eq([1, 2])
    end
  end
end
