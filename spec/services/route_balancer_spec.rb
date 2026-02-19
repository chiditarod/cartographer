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

    context 'balancing quality' do
      # Helper to find or create a leg between two locations (avoids unique constraint
      # violation from Leg's create_mirror_leg callback).
      def find_or_create_leg(start_loc, finish_loc)
        Leg.find_by(start: start_loc, finish: finish_loc) ||
          FactoryBot.create(:leg, start: start_loc, finish: finish_loc)
      end

      # Helper to create a complete route with a specific location sequence.
      # sequence is an array of intermediate CP locations (not including start/finish).
      def create_route_with_sequence(race, sequence)
        route = FactoryBot.create(:route, race: race)

        prev = race.start
        sequence.each do |loc|
          route.legs << find_or_create_leg(prev, loc)
          prev = loc
        end
        route.legs << find_or_create_leg(prev, race.finish)
        route.save!
        route
      end

      # Use generous distance limits so route validations don't interfere
      let(:race_attrs) do
        { min_total_distance: 0.1, max_total_distance: 100,
          min_leg_distance: 0.01, max_leg_distance: 50 }
      end

      it 'covers all locations at each position when possible' do
        race = FactoryBot.create(:race, num_stops: 3, **race_attrs)
        a = FactoryBot.create(:location)
        b = FactoryBot.create(:location)
        c = FactoryBot.create(:location)
        race.locations = [race.start, race.finish, a, b, c]

        # 6 routes covering all permutations of [A, B, C] at [CP1, CP2, CP3]
        sequences = [
          [a, b, c], [b, c, a], [c, a, b],
          [a, c, b], [b, a, c], [c, b, a]
        ]
        routes = sequences.map { |seq| create_route_with_sequence(race, seq) }

        # Select 3 — algorithm should cover all 3 locations at all 3 positions
        result = RouteBalancer.call(race, 3)

        selected_routes = routes.select { |r| result.include?(r.id) }
        freq = Array.new(3) { Hash.new(0) }
        selected_routes.each do |r|
          locations = r.legs.map { |l| l.start.id } + [r.legs.last.finish.id]
          locations[1..3].each_with_index { |loc_id, pos| freq[pos][loc_id] += 1 }
        end

        [a, b, c].each do |loc|
          3.times do |pos|
            expect(freq[pos][loc.id]).to be >= 1,
              "Expected #{loc.name} at CP#{pos + 1} at least once, got #{freq[pos][loc.id]}"
          end
        end
      end

      it 'prioritizes filling uncovered cells over balancing already-covered ones' do
        race = FactoryBot.create(:race, num_stops: 2, **race_attrs)
        a = FactoryBot.create(:location)
        b = FactoryBot.create(:location)
        race.locations = [race.start, race.finish, a, b]

        # Route 1: [A, A]  Route 2: [A, B]  Route 3: [B, A]
        r1 = create_route_with_sequence(race, [a, a])
        r2 = create_route_with_sequence(race, [a, b])
        r3 = create_route_with_sequence(race, [b, a])

        result = RouteBalancer.call(race, 2)

        # r2 + r3 cover all (position, location) pairs; r1 is dominated
        expect(result).to contain_exactly(r2.id, r3.id)
      end
    end
  end
end
