require 'rails_helper'

RSpec.describe Race, type: :model do

  describe 'validations' do
    let(:race) { FactoryBot.create(:race) }

    it 'is valid with valid attributes' do
      expect(race).to be_valid
    end

    it 'requires num_stops to be an integer' do
      race.num_stops = 'abc'
      expect(race).to be_invalid
    end

    it 'requires max_teams to be an integer' do
      race.max_teams = nil
      expect(race).to be_invalid
    end

    it 'requires people_per_team to be an integer' do
      race.people_per_team = 2.5
      expect(race).to be_invalid
    end

    it 'requires min_total_distance to be numeric' do
      race.min_total_distance = 'abc'
      expect(race).to be_invalid
    end

    it 'requires max_total_distance to be numeric' do
      race.max_total_distance = nil
      expect(race).to be_invalid
    end

    it 'requires min_leg_distance to be numeric' do
      race.min_leg_distance = 'abc'
      expect(race).to be_invalid
    end

    it 'requires max_leg_distance to be numeric' do
      race.max_leg_distance = nil
      expect(race).to be_invalid
    end
  end

  describe 'associations' do
    let(:race) { FactoryBot.create(:race, :with_locations) }

    it 'belongs to a start location' do
      expect(race.start).to be_a(Location)
    end

    it 'belongs to a finish location' do
      expect(race.finish).to be_a(Location)
    end

    it 'has and belongs to many locations' do
      expect(race.locations.count).to be >= 2
    end

    it 'has many routes' do
      route = FactoryBot.create(:route, race: race)
      expect(race.routes).to include(route)
    end
  end

  describe 'distance_unit enum' do
    let(:race) { FactoryBot.create(:race) }

    it 'defaults to mi' do
      expect(race.mi?).to be true
    end

    it 'can be set to km' do
      race.km!
      expect(race.km?).to be true
      expect(race.mi?).to be false
    end
  end

  describe 'distance conversion methods' do
    context 'when distance_unit is mi' do
      let(:race) do
        FactoryBot.create(:race,
          min_total_distance: 2.0,
          max_total_distance: 4.0,
          min_leg_distance: 0.5,
          max_leg_distance: 1.5
        )
      end

      it 'converts min_total_distance to meters' do
        expected = Distances.mi_to_m(2.0)
        expect(race.min_total_distance_m).to eq(expected)
      end

      it 'converts max_total_distance to meters' do
        expected = Distances.mi_to_m(4.0)
        expect(race.max_total_distance_m).to eq(expected)
      end

      it 'converts min_leg_distance to meters' do
        expected = Distances.mi_to_m(0.5)
        expect(race.min_leg_distance_m).to eq(expected)
      end

      it 'converts max_leg_distance to meters' do
        expected = Distances.mi_to_m(1.5)
        expect(race.max_leg_distance_m).to eq(expected)
      end
    end

    context 'when distance_unit is km' do
      let(:race) do
        FactoryBot.create(:race,
          min_total_distance: 3.0,
          max_total_distance: 6.0,
          min_leg_distance: 1.0,
          max_leg_distance: 2.0,
          distance_unit: :km
        )
      end

      it 'converts min_total_distance to meters (km * 1000)' do
        expect(race.min_total_distance_m).to eq(3000.0)
      end

      it 'converts max_total_distance to meters (km * 1000)' do
        expect(race.max_total_distance_m).to eq(6000.0)
      end

      it 'converts min_leg_distance to meters (km * 1000)' do
        expect(race.min_leg_distance_m).to eq(1000.0)
      end

      it 'converts max_leg_distance to meters (km * 1000)' do
        expect(race.max_leg_distance_m).to eq(2000.0)
      end
    end
  end

  describe '#to_s' do
    let(:race) do
      FactoryBot.create(:race,
        name: 'CHIditarod 2024',
        num_stops: 3,
        min_total_distance: 2.5,
        max_total_distance: 3.5,
        min_leg_distance: 0.8,
        max_leg_distance: 1.2
      )
    end

    it 'returns formatted string' do
      result = race.to_s
      expect(result).to include('CHIditarod 2024')
      expect(result).to include('stops: 3')
      expect(result).to include('2.5/3.5')
      expect(result).to include('0.8/1.2')
      expect(result).to include('mi')
    end
  end
end
