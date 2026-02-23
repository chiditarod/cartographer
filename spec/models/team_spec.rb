# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Team, type: :model do
  describe 'validations' do
    let(:race) { FactoryBot.create(:race) }

    it 'is valid with valid attributes' do
      team = FactoryBot.build(:team, race: race, dogtag_id: 1)
      expect(team).to be_valid
    end

    it 'requires a name' do
      team = FactoryBot.build(:team, race: race, name: nil)
      expect(team).to be_invalid
      expect(team.errors[:name]).to include("can't be blank")
    end

    it 'requires a dogtag_id' do
      team = FactoryBot.build(:team, race: race, dogtag_id: nil)
      expect(team).to be_invalid
    end

    it 'requires dogtag_id to be positive' do
      team = FactoryBot.build(:team, race: race, dogtag_id: 0)
      expect(team).to be_invalid
    end

    it 'requires dogtag_id to be unique within race' do
      FactoryBot.create(:team, race: race, dogtag_id: 42)
      team = FactoryBot.build(:team, race: race, dogtag_id: 42)
      expect(team).to be_invalid
      expect(team.errors[:dogtag_id]).to include("has already been taken")
    end

    it 'allows same dogtag_id in different races' do
      other_race = FactoryBot.create(:race)
      FactoryBot.create(:team, race: race, dogtag_id: 42)
      team = FactoryBot.build(:team, race: other_race, dogtag_id: 42)
      expect(team).to be_valid
    end

    it 'validates route belongs to same race' do
      other_race = FactoryBot.create(:race)
      route = FactoryBot.create(:route, race: other_race)
      team = FactoryBot.build(:team, race: race, route: route, dogtag_id: 1)
      expect(team).to be_invalid
      expect(team.errors[:route]).to include("must belong to the same race")
    end

    it 'allows nil route' do
      team = FactoryBot.build(:team, race: race, route: nil, dogtag_id: 1)
      expect(team).to be_valid
    end

    context 'bib_number' do
      it 'allows nil bib_number' do
        team = FactoryBot.build(:team, race: race, dogtag_id: 1, bib_number: nil)
        expect(team).to be_valid
      end

      it 'requires bib_number to be positive when set' do
        team = FactoryBot.build(:team, race: race, dogtag_id: 1, bib_number: 0)
        expect(team).to be_invalid
      end

      it 'requires bib_number to be unique within race when set' do
        FactoryBot.create(:team, race: race, dogtag_id: 1, bib_number: 99)
        team = FactoryBot.build(:team, race: race, dogtag_id: 2, bib_number: 99)
        expect(team).to be_invalid
        expect(team.errors[:bib_number]).to include("has already been taken")
      end

      it 'allows same bib_number in different races' do
        other_race = FactoryBot.create(:race)
        FactoryBot.create(:team, race: race, dogtag_id: 1, bib_number: 99)
        team = FactoryBot.build(:team, race: other_race, dogtag_id: 1, bib_number: 99)
        expect(team).to be_valid
      end

      it 'allows multiple nil bib_numbers in same race' do
        FactoryBot.create(:team, race: race, dogtag_id: 1, bib_number: nil)
        team = FactoryBot.build(:team, race: race, dogtag_id: 2, bib_number: nil)
        expect(team).to be_valid
      end
    end
  end

  describe '#display_number' do
    let(:race) { FactoryBot.create(:race) }

    it 'returns bib_number when set' do
      team = FactoryBot.build(:team, race: race, dogtag_id: 1, bib_number: 42)
      expect(team.display_number).to eq(42)
    end

    it 'falls back to dogtag_id when bib_number is nil' do
      team = FactoryBot.build(:team, race: race, dogtag_id: 7, bib_number: nil)
      expect(team.display_number).to eq(7)
    end
  end
end
