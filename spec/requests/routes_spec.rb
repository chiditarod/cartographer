# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Routes', type: :request do
  let(:race) { FactoryBot.create(:race, :with_locations) }

  describe 'GET /races/:race_id/routes' do
    it 'returns a successful response' do
      get race_routes_path(race)
      expect(response).to have_http_status(:success)
    end

    it 'displays routes for the race' do
      route = FactoryBot.create(:sequential_route, race: race)
      get race_routes_path(race)
      expect(response).to have_http_status(:success)
    end
  end

  describe 'GET /races/:race_id/routes/:id' do
    let(:route) { FactoryBot.create(:sequential_route, race: race) }

    it 'returns a successful response' do
      get race_route_path(race, route)
      expect(response).to have_http_status(:success)
    end

    it 'displays the route details' do
      get race_route_path(race, route)
      expect(response.body).to include(race.name)
    end
  end
end
