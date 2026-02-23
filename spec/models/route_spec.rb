# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Route, type: :model do

  describe 'validations' do

    context 'while route is being built (# checkpoints < required)' do
      let(:route) { FactoryBot.create :route }

      it 'is valid' do
        expect(route).to be_valid
      end

      it 'is not complete' do
        expect(route.complete?).to be false
        expect(route.complete).to be false
      end
    end

    context 'when fully built (# checkpoints == required)' do
      let(:route) { FactoryBot.create :sequential_route }

      it 'is valid' do
        expect(route).to be_valid
      end

      it 'completes all requirements' do
        expect(route.complete?).to be true
      end

      it 'sets complete bool to true' do
        expect(route.complete).to be true
      end
    end

    context 'when there are too few legs' do
      let(:route) { FactoryBot.create :sequential_route }
      it 'becomes invalid' do
        expect(route).to be_valid
        last_join = route.legs_routes.last
        LegsRoute.where(leg_id: last_join.leg_id, route_id: last_join.route_id, order: last_join.order).delete_all
        route.reload
        expect(route).to be_invalid
      end
    end

    context 'when there are too many legs' do
      let(:route) { FactoryBot.create :sequential_route }
      it 'becomes invalid' do
        expect(route).to be_valid
        loc = FactoryBot.create :location
        route.race.locations << loc
        last_leg = route.legs.last
        leg = FactoryBot.create :leg, start: loc, finish: last_leg.finish
        last_leg.finish = leg.start
        route.legs << leg
        expect(route).to be_invalid
      end
    end

    context 'when a leg is too short' do
      let(:route) { FactoryBot.create :sequential_route }
      it 'becomes invalid' do
        expect(route).to be_valid
        route.legs.last.distance = route.race.min_leg_distance - 0.1
        expect(route).to be_invalid
      end
    end

    context 'when a leg is too long' do
      let(:route) { FactoryBot.create :sequential_route }
      it 'becomes invalid' do
        expect(route).to be_valid
        route.legs.last.distance = route.race.max_leg_distance + 0.1
        expect(route).to be_invalid
      end
    end

    context 'when a leg uses a location not allowed by the race' do
      let(:route) { FactoryBot.create :route }
      let(:leg) { FactoryBot.create :leg, start: route.race.start }

      it 'becomes invalid' do
        expect(route).to be_valid
        route.legs << leg
        expect(route).to be_invalid
        route.race.locations << leg.finish
        expect(route).to be_valid
      end
    end

    context 'when the route is longer than the race allows' do
      # make the leg distance huge to avoid validation failing on leg distance
      let(:race) { FactoryBot.create :race, max_leg_distance: 1000 }
      let(:route) { FactoryBot.create :sequential_route, race: race }
      it 'becomes invalid' do
        expect(route).to be_valid
        route.legs.last.distance = route.race.max_total_distance
        expect(route).to be_invalid
      end
    end

    context 'when the route is shorter than the race allows' do
      # make the leg distance minimum 0 to avoid validation failing on leg distance
      let(:race) { FactoryBot.create :race, min_leg_distance: 0 }
      let(:route) { FactoryBot.create :sequential_route, race: race }
      it 'becomes invalid' do
        expect(route).to be_valid
        route.legs.last.distance = 0.1
        expect(route).to be_invalid
      end
    end

    describe 'validate_finish_not_used_until_end' do
      let(:route) { FactoryBot.create :route }

      it 'is invalid when finish location is used mid-route' do
        leg = FactoryBot.create(:leg, start: route.race.start, finish: route.race.finish)
        route.race.locations << leg.start << leg.finish
        route.legs << leg
        # route is incomplete (has 1 of 3 legs) but uses race finish
        expect(route).to be_invalid
        expect(route.errors[:legs].join).to include('cannot be used until the end')
      end
    end

    describe 'validate_finish_is_at_end' do
      it 'is invalid when last leg does not end at race finish' do
        route = FactoryBot.create(:sequential_route)
        expect(route).to be_valid

        # Replace the last leg's finish with a different location
        new_finish = FactoryBot.create(:location)
        route.race.locations << new_finish
        last_leg = route.legs.last
        last_leg.finish = new_finish

        expect(route).to be_invalid
        expect(route.errors[:legs].join).to include('The last leg needs to finish at')
      end
    end
  end

  describe 'custom routes' do
    let(:race) { FactoryBot.create(:race, :with_locations) }

    it 'is valid with fewer legs than num_stops + 1' do
      # Create a custom route with just 1 leg (start -> some checkpoint -> finish would be 2 legs, but just 1 is ok)
      leg = FactoryBot.create(:leg, start: race.start, finish: race.locations.reject { |l| l == race.start || l == race.finish }.first)
      race.locations << leg.finish unless race.locations.include?(leg.finish)
      route = Route.create!(race: race, custom: true)
      route.legs << leg
      expect(route).to be_valid
    end

    it 'is complete when last leg ends at finish' do
      intermediates = race.locations.reject { |l| l == race.start || l == race.finish }
      cp = intermediates.first
      leg1 = FactoryBot.create(:leg, start: race.start, finish: cp)
      leg2 = FactoryBot.create(:leg, start: cp, finish: race.finish)
      route = Route.create!(race: race, custom: true)
      route.legs << leg1
      route.legs << leg2
      route.save!
      expect(route.complete).to be true
    end

    it 'is not complete without leg ending at finish' do
      intermediates = race.locations.reject { |l| l == race.start || l == race.finish }
      cp = intermediates.first
      leg1 = FactoryBot.create(:leg, start: race.start, finish: cp)
      route = Route.create!(race: race, custom: true)
      route.legs << leg1
      route.save!
      expect(route.complete).to be false
    end

    it 'skips leg distance validation' do
      intermediates = race.locations.reject { |l| l == race.start || l == race.finish }
      cp = intermediates.first
      leg1 = FactoryBot.create(:leg, start: race.start, finish: cp, distance: 0.01) # tiny distance
      leg2 = FactoryBot.create(:leg, start: cp, finish: race.finish, distance: 0.01)
      route = Route.create!(race: race, custom: true)
      route.legs << leg1
      route.legs << leg2
      expect(route).to be_valid
    end

    it 'skips total distance validation' do
      intermediates = race.locations.reject { |l| l == race.start || l == race.finish }
      cp = intermediates.first
      leg1 = FactoryBot.create(:leg, start: race.start, finish: cp, distance: 100_000) # huge distance
      leg2 = FactoryBot.create(:leg, start: cp, finish: race.finish, distance: 100_000)
      route = Route.create!(race: race, custom: true)
      route.legs << leg1
      route.legs << leg2
      route.save!
      # Would fail for non-custom route but should be valid for custom
      expect(route).to be_valid
    end

    it 'still validates locations in race pool' do
      outside_loc = FactoryBot.create(:location)
      leg = FactoryBot.create(:leg, start: race.start, finish: outside_loc)
      route = Route.create!(race: race, custom: true)
      route.legs << leg
      expect(route).to be_invalid
      expect(route.errors[:legs].join).to include('not allowed in this race')
    end
  end

  describe '#to_s' do
    it 'returns "EMPTY" when route has no legs' do
      route = FactoryBot.create(:route)
      expect(route.to_s).to eq('EMPTY')
    end

    it 'returns formatted string when route has legs' do
      route = FactoryBot.create(:sequential_route)
      result = route.to_s
      expect(result).to include('legs')
      expect(result).to include(route.race.distance_unit)
    end
  end

  describe '#to_csv' do
    it 'returns header and zero-value CSV when route has no legs' do
      route = FactoryBot.create(:route)
      result = route.to_csv
      lines = result.split("\n")
      expect(lines[0]).to eq("Route ID,Leg Count,Target Leg Count,Rarity Score,Unit")
      expect(lines[1]).to eq("0,0,0,,#{route.race.distance_unit}")
    end

    it 'returns header row followed by data row' do
      route = FactoryBot.create(:sequential_route)
      result = route.to_csv
      lines = result.split("\n")
      expect(lines.size).to eq(2)
      expect(lines[0]).to start_with("Route ID,Leg Count,Target Leg Count,Total Distance,Rarity Score,Unit,Start")
      expect(lines[1]).to include(route.id.to_s)
      expect(lines[1]).to include(route.race.distance_unit)
    end
  end

  describe '#distance' do
    it 'returns total distance in miles for mi race' do
      route = FactoryBot.create(:sequential_route)
      route.race.update!(distance_unit: 'mi')
      total_meters = route.legs.sum(&:distance)
      expected = Distances.m_to_mi(total_meters).round(2)
      expect(route.distance).to eq(expected)
    end

    it 'returns total distance in km for km race' do
      route = FactoryBot.create(:sequential_route)
      route.race.update!(distance_unit: 'km')
      total_meters = route.legs.sum(&:distance)
      expected = (total_meters / 1000).round(2)
      expect(route.distance).to eq(expected)
    end
  end

  describe '#legs_needed' do
    it 'returns the difference between target and current leg count' do
      route = FactoryBot.create(:route)
      expected = route.target_leg_count - route.legs.size
      expect(route.legs_needed).to eq(expected)
    end

    it 'returns 0 when route has all legs' do
      route = FactoryBot.create(:sequential_route)
      expect(route.legs_needed).to eq(0)
    end
  end

  describe '.to_google_map' do

    context 'when the route is not complete' do
      let(:route) { FactoryBot.create :incomplete_route }
      it 'returns nil' do
        expect(route.to_google_map).to be_nil
      end
    end

    context 'when the route is complete but has no lat/lng data' do
      let(:route) { FactoryBot.create :sequential_route }
      it 'returns descriptive text' do
        expect(route.to_google_map).to eq('requires lat and lng')
      end
    end

    context 'when the route is complete and has lat/lng data' do
      let(:route) { FactoryBot.create :sequential_route, :with_lat_lng }
      let(:expected) { map_url(route, Route::MAP_DEFAULT_ZOOM) }

      it 'returns correct URL' do
        expect(route.to_google_map).to eq(expected)
      end
    end

    context 'when MOCK_MAP env var is set' do
      let(:route) { FactoryBot.create :sequential_route, :with_lat_lng }
      it 'returns returns a mock map' do
        stub_const('ENV', ENV.to_hash.merge('MOCK_MAP' => 'true'))
        expect(route.to_google_map).to eq('/mock-route-map.png')
      end
    end

    context 'with a custom zoom level' do
      let(:route) { FactoryBot.create :sequential_route, :with_lat_lng }
      let(:zoom) { 20 }
      let(:expected) { map_url(route, zoom) }

      it 'returns returns a map with custom zoom level' do
        expect(route.to_google_map(zoom)).to eq(expected)
      end
    end

    def map_url(route, zoom)
      legs_arr = route.legs.to_a
      start_leg = legs_arr.slice!(0)

      legs = ""
      legs_arr.each_with_index do |leg, i|
        legs += "&markers=color:white%7Clabel:#{i+1}%7C#{leg.start.lat_lng}"
      end

      "https://maps.googleapis.com/maps/api/staticmap?scale=2&zoom=#{zoom}&size=1024x768&style=feature:poi|visibility:off&markers=icon:#{Route::MAP_START_ICON}%7C#{start_leg.start.lat_lng}#{legs}&markers=icon:#{Route::MAP_START_ICON}%7C#{legs_arr.last.finish.lat_lng}&key="
    end
  end
end
