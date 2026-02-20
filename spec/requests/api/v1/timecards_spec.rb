# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Timecards', type: :request do
  describe 'GET /api/v1/races/:race_id/timecards/export_pdf' do
    let(:route) { FactoryBot.create(:sequential_route) }
    let(:race) { route.race }

    it 'returns a PDF when teams are assigned' do
      FactoryBot.create(:team, race: race, route: route, bib_number: 1)

      get "/api/v1/races/#{race.id}/timecards/export_pdf"
      expect(response).to have_http_status(:ok)
      expect(response.content_type).to include('application/pdf')
      expect(response.body).to start_with('%PDF')
    end

    it 'returns 422 when no teams are assigned' do
      get "/api/v1/races/#{race.id}/timecards/export_pdf"
      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json['error']).to include('No teams')
    end

    it 'returns 422 when teams exist but none are assigned to routes' do
      FactoryBot.create(:team, race: race, bib_number: 1) # no route

      get "/api/v1/races/#{race.id}/timecards/export_pdf"
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end
end
