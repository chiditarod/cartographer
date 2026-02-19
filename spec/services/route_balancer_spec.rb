# frozen_string_literal: true

require 'rails_helper'

RSpec.describe RouteBalancer do
  describe '.call' do
    it 'returns the requested number of route IDs' do
      race = FactoryBot.create(:race, :with_locations, num_stops: 2)
      routes = Array.new(5) { FactoryBot.create(:sequential_route, race: race) }

      result = RouteBalancer.call(race, 3)

      expect(result).to be_an(Array)
      expect(result.size).to eq(3)
      expect(result).to all(be_a(Integer))
      expect(result - routes.map(&:id)).to be_empty
    end

    it 'returns all routes when count equals total' do
      race = FactoryBot.create(:race, :with_locations, num_stops: 2)
      routes = Array.new(3) { FactoryBot.create(:sequential_route, race: race) }

      result = RouteBalancer.call(race, 3)

      expect(result.sort).to eq(routes.map(&:id).sort)
    end

    it 'returns empty array when count is 0' do
      race = FactoryBot.create(:race, :with_locations, num_stops: 2)
      FactoryBot.create(:sequential_route, race: race)

      result = RouteBalancer.call(race, 0)

      expect(result).to eq([])
    end

    it 'only considers complete routes' do
      race = FactoryBot.create(:race, :with_locations, num_stops: 2)
      complete = FactoryBot.create(:sequential_route, race: race)
      FactoryBot.create(:incomplete_route, race: race)

      result = RouteBalancer.call(race, 1)

      expect(result).to eq([complete.id])
    end
  end
end
