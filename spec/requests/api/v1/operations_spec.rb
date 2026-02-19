# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Operations', type: :request do
  describe 'POST /api/v1/races/:race_id/generate_legs' do
    it 'creates a job status and returns its id' do
      race = FactoryBot.create(:race, :with_locations)

      post "/api/v1/races/#{race.id}/generate_legs", params: { mock: true }
      expect(response).to have_http_status(:accepted)
      json = JSON.parse(response.body)
      expect(json).to have_key('job_status_id')

      job_status = JobStatus.find(json['job_status_id'])
      expect(job_status.job_type).to eq('generate_legs')
    end
  end

  describe 'POST /api/v1/races/:race_id/generate_routes' do
    it 'creates a job status and returns its id' do
      race = FactoryBot.create(:race, :with_locations)

      post "/api/v1/races/#{race.id}/generate_routes"
      expect(response).to have_http_status(:accepted)
      json = JSON.parse(response.body)
      expect(json).to have_key('job_status_id')

      job_status = JobStatus.find(json['job_status_id'])
      expect(job_status.job_type).to eq('generate_routes')
    end
  end

  describe 'POST /api/v1/geocode' do
    it 'creates a job status and returns its id' do
      loc = FactoryBot.create(:location)

      post '/api/v1/geocode', params: { location_ids: [loc.id] }
      expect(response).to have_http_status(:accepted)
      json = JSON.parse(response.body)
      expect(json).to have_key('job_status_id')

      job_status = JobStatus.find(json['job_status_id'])
      expect(job_status.job_type).to eq('geocode')
    end
  end

  describe 'POST /api/v1/races/:race_id/rank_routes' do
    it 'creates a job status and returns its id' do
      race = FactoryBot.create(:race, :with_locations)

      post "/api/v1/races/#{race.id}/rank_routes"
      expect(response).to have_http_status(:accepted)
      json = JSON.parse(response.body)
      expect(json).to have_key('job_status_id')

      job_status = JobStatus.find(json['job_status_id'])
      expect(job_status.job_type).to eq('rank_routes')
    end
  end

  describe 'POST /api/v1/races/:race_id/auto_select' do
    it 'returns selected route IDs' do
      race = FactoryBot.create(:race, :with_locations, num_stops: 2)
      routes = Array.new(3) { FactoryBot.create(:sequential_route, race: race) }

      post "/api/v1/races/#{race.id}/auto_select", params: { count: 2 }
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['route_ids']).to be_an(Array)
      expect(json['route_ids'].size).to eq(2)
    end

    it 'returns 422 when count exceeds complete routes' do
      race = FactoryBot.create(:race, :with_locations, num_stops: 2)
      FactoryBot.create(:sequential_route, race: race)

      post "/api/v1/races/#{race.id}/auto_select", params: { count: 5 }
      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json['error']).to be_present
    end

    it 'returns 422 when count is 0' do
      race = FactoryBot.create(:race, :with_locations, num_stops: 2)
      FactoryBot.create(:sequential_route, race: race)

      post "/api/v1/races/#{race.id}/auto_select", params: { count: 0 }
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it 'returns 422 when count is negative' do
      race = FactoryBot.create(:race, :with_locations, num_stops: 2)

      post "/api/v1/races/#{race.id}/auto_select", params: { count: -1 }
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe 'GET /api/v1/job_statuses/:id' do
    it 'returns job status' do
      js = JobStatus.create!(job_type: 'test', status: 'running', progress: 5, total: 10)
      get "/api/v1/job_statuses/#{js.id}"
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['status']).to eq('running')
      expect(json['progress']).to eq(5)
      expect(json['total']).to eq(10)
    end
  end
end
