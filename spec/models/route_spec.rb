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