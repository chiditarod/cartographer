# frozen_string_literal: true

require 'rails_helper'

RSpec.describe RankRoutesJob, type: :job do
  describe '#perform' do
    let(:race) { FactoryBot.create(:race, num_stops: 2) }
    let(:job_status) do
      JobStatus.create!(job_type: 'rank_routes', status: 'running')
    end

    it 'calculates rarity scores for complete routes' do
      # Create 3 routes with different checkpoint sequences
      # Route structure: start -> CP1 -> CP2 -> finish (num_stops=2 means 3 legs)
      # location_sequence indices: [0]=start, [1]=CP1, [2]=CP2, [3]=finish
      # Only indices 1 and 2 are intermediate CPs

      loc_a = FactoryBot.create(:location)
      loc_b = FactoryBot.create(:location)
      loc_c = FactoryBot.create(:location)

      race.locations = [race.start, race.finish, loc_a, loc_b, loc_c]

      # Route 1: start -> A -> B -> finish
      route1 = Route.create!(race: race)
      leg1a = Leg.create!(start: race.start, finish: loc_a, distance: 1609)
      leg1b = Leg.create!(start: loc_a, finish: loc_b, distance: 1609)
      leg1c = Leg.create!(start: loc_b, finish: race.finish, distance: 1609)
      route1.legs << leg1a
      route1.legs << leg1b
      route1.legs << leg1c
      route1.save!
      expect(route1.complete).to be true

      # Route 2: start -> A -> C -> finish
      route2 = Route.create!(race: race)
      leg2a = Leg.find_or_create_by!(start: race.start, finish: loc_a) { |l| l.distance = 1609 }
      leg2b = Leg.create!(start: loc_a, finish: loc_c, distance: 1609)
      leg2c = Leg.create!(start: loc_c, finish: race.finish, distance: 1609)
      route2.legs << leg2a
      route2.legs << leg2b
      route2.legs << leg2c
      route2.save!
      expect(route2.complete).to be true

      # Route 3: start -> B -> C -> finish
      route3 = Route.create!(race: race)
      leg3a = Leg.create!(start: race.start, finish: loc_b, distance: 1609)
      leg3b = Leg.find_or_create_by!(start: loc_b, finish: loc_c) { |l| l.distance = 1609 }
      leg3c = Leg.find_or_create_by!(start: loc_c, finish: race.finish) { |l| l.distance = 1609 }
      route3.legs << leg3a
      route3.legs << leg3b
      route3.legs << leg3c
      route3.save!
      expect(route3.complete).to be true

      # N = 3 routes, S = 2 intermediate CPs
      # Frequency matrix:
      #   CP1: A appears 2x, B appears 1x
      #   CP2: B appears 1x, C appears 2x
      #
      # Route 1 (A at CP1, B at CP2):
      #   CP1 score = 1 - 2/3 = 0.333...
      #   CP2 score = 1 - 1/3 = 0.666...
      #   raw = 1.0, normalized = (1.0 / 2) * 100 = 50.0
      #
      # Route 2 (A at CP1, C at CP2):
      #   CP1 score = 1 - 2/3 = 0.333...
      #   CP2 score = 1 - 2/3 = 0.333...
      #   raw = 0.666..., normalized = (0.666... / 2) * 100 = 33.3
      #
      # Route 3 (B at CP1, C at CP2):
      #   CP1 score = 1 - 1/3 = 0.666...
      #   CP2 score = 1 - 2/3 = 0.333...
      #   raw = 1.0, normalized = (1.0 / 2) * 100 = 50.0

      RankRoutesJob.perform_now(job_status.id, race.id)

      route1.reload
      route2.reload
      route3.reload

      expect(route1.rarity_score).to eq(50.0)
      expect(route2.rarity_score).to eq(33.3)
      expect(route3.rarity_score).to eq(50.0)
    end

    it 'updates job status on completion' do
      loc_a = FactoryBot.create(:location)
      loc_b = FactoryBot.create(:location)
      race.locations = [race.start, race.finish, loc_a, loc_b]

      route = Route.create!(race: race)
      route.legs << Leg.create!(start: race.start, finish: loc_a, distance: 1609)
      route.legs << Leg.create!(start: loc_a, finish: loc_b, distance: 1609)
      route.legs << Leg.create!(start: loc_b, finish: race.finish, distance: 1609)
      route.save!

      RankRoutesJob.perform_now(job_status.id, race.id)

      job_status.reload
      expect(job_status.status).to eq('completed')
      expect(job_status.total).to eq(1)
      expect(job_status.progress).to eq(1)
      expect(job_status.message).to match(/Ranked 1 route/)
    end

    it 'handles errors and marks job as failed' do
      allow(Race).to receive(:find).and_raise(ActiveRecord::RecordNotFound)

      expect {
        RankRoutesJob.perform_now(job_status.id, race.id)
      }.to raise_error(ActiveRecord::RecordNotFound)

      job_status.reload
      expect(job_status.status).to eq('failed')
    end

    it 'skips races with no complete routes' do
      RankRoutesJob.perform_now(job_status.id, race.id)

      job_status.reload
      expect(job_status.status).to eq('completed')
      expect(job_status.message).to match(/Ranked 0 routes/)
    end
  end
end
