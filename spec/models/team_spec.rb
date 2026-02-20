# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Team, type: :model do
  describe 'validations' do
    let(:race) { FactoryBot.create(:race) }

    it 'is valid with valid attributes' do
      team = FactoryBot.build(:team, race: race, bib_number: 1)
      expect(team).to be_valid
    end

    it 'requires a name' do
      team = FactoryBot.build(:team, race: race, name: nil)
      expect(team).to be_invalid
      expect(team.errors[:name]).to include("can't be blank")
    end

    it 'requires a bib_number' do
      team = FactoryBot.build(:team, race: race, bib_number: nil)
      expect(team).to be_invalid
    end

    it 'requires bib_number to be positive' do
      team = FactoryBot.build(:team, race: race, bib_number: 0)
      expect(team).to be_invalid
    end

    it 'requires bib_number to be unique within race' do
      FactoryBot.create(:team, race: race, bib_number: 42)
      team = FactoryBot.build(:team, race: race, bib_number: 42)
      expect(team).to be_invalid
      expect(team.errors[:bib_number]).to include("has already been taken")
    end

    it 'allows same bib_number in different races' do
      other_race = FactoryBot.create(:race)
      FactoryBot.create(:team, race: race, bib_number: 42)
      team = FactoryBot.build(:team, race: other_race, bib_number: 42)
      expect(team).to be_valid
    end

    it 'validates route belongs to same race' do
      other_race = FactoryBot.create(:race)
      route = FactoryBot.create(:route, race: other_race)
      team = FactoryBot.build(:team, race: race, route: route, bib_number: 1)
      expect(team).to be_invalid
      expect(team.errors[:route]).to include("must belong to the same race")
    end

    it 'allows nil route' do
      team = FactoryBot.build(:team, race: race, route: nil, bib_number: 1)
      expect(team).to be_valid
    end
  end
end
