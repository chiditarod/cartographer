# frozen_string_literal: true

require 'rails_helper'

RSpec.describe RouteGenerator do

  describe '.call' do
    let(:race) { FactoryBot.create(:race, :with_locations, num_stops: 2) }

    before do
      # Create legs between all locations in the race
      locations = race.locations.to_a
      locations.each do |loc_a|
        locations.each do |loc_b|
          next if loc_a == loc_b
          next if Leg.where(start: loc_a, finish: loc_b).exists?
          Leg.create!(start: loc_a, finish: loc_b, distance: 1609) # ~1 mile
        end
      end
    end

    it 'creates complete routes' do
      # Suppress stdout from RouteGenerator
      expect { RouteGenerator.call(race) }.to output.to_stdout

      complete_routes = Route.where(race: race, complete: true)
      expect(complete_routes.count).to be >= 1
    end

    it 'creates routes that start at the race start' do
      expect { RouteGenerator.call(race) }.to output.to_stdout

      Route.where(race: race, complete: true).each do |route|
        expect(route.legs.first.start).to eq(race.start)
      end
    end

    it 'creates routes that end at the race finish' do
      expect { RouteGenerator.call(race) }.to output.to_stdout

      Route.where(race: race, complete: true).each do |route|
        expect(route.legs.last.finish).to eq(race.finish)
      end
    end

    it 'creates routes with the correct number of legs' do
      expect { RouteGenerator.call(race) }.to output.to_stdout

      Route.where(race: race, complete: true).each do |route|
        expect(route.legs.count).to eq(race.num_stops + 1)
      end
    end
  end

  describe '.build_pool (via .call behavior)' do
    let(:race) { FactoryBot.create(:race, num_stops: 1) }

    context 'when no legs exist for the race locations' do
      it 'does not create any complete routes' do
        expect { RouteGenerator.call(race) }.to output.to_stdout

        complete_routes = Route.where(race: race, complete: true)
        expect(complete_routes.count).to eq(0)
      end
    end
  end
end
