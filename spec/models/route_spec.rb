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
      end
    end

    context 'when fully built (# checkpoints == required)' do
      let(:route) { FactoryBot.create :sequential_route }

      it 'is valid' do
        expect(route).to be_valid
      end

      it 'is complete' do
        expect(route.complete?).to be true
      end
    end

    context 'when there are too few legs' do
      let(:route) { FactoryBot.create :sequential_route }
      it 'becomes invalid' do
        expect(route).to be_valid
        route.legs.destroy(route.legs.last)
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
end
