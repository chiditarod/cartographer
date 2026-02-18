# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Legs', type: :request do
  describe 'GET /api/v1/legs' do
    it 'returns legs' do
      FactoryBot.create(:leg)
      get '/api/v1/legs'
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['count']).to be >= 1
      expect(json['legs']).to be_an(Array)
    end

    it 'filters by race_id' do
      race = FactoryBot.create(:race, :with_locations)
      loc1, loc2 = race.locations.first(2)
      Leg.create!(start: loc1, finish: loc2, distance: 1000)

      get '/api/v1/legs', params: { race_id: race.id }
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['count']).to be >= 1
    end
  end

  describe 'DELETE /api/v1/legs/:id' do
    it 'deletes a specific leg' do
      leg = FactoryBot.create(:leg)
      expect {
        delete "/api/v1/legs/#{leg.id}"
      }.to change(Leg, :count).by(-1)
      expect(response).to have_http_status(:ok)
    end

    it 'deletes all legs' do
      FactoryBot.create(:leg)
      delete '/api/v1/legs/all'
      expect(response).to have_http_status(:ok)
      expect(Leg.count).to eq(0)
    end
  end
end
