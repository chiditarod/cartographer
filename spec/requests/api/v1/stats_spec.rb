# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Stats', type: :request do
  describe 'GET /api/v1/stats' do
    it 'returns stats' do
      get '/api/v1/stats'
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json).to have_key('locations')
      expect(json).to have_key('races')
      expect(json).to have_key('legs')
      expect(json).to have_key('routes')
      expect(json).to have_key('complete_routes')
    end

    it 'returns correct counts' do
      FactoryBot.create(:location)
      FactoryBot.create(:race)

      get '/api/v1/stats'
      json = JSON.parse(response.body)
      expect(json['locations']).to be >= 1
      expect(json['races']).to be >= 1
    end
  end
end
