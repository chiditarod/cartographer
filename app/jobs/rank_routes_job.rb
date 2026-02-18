# frozen_string_literal: true

class RankRoutesJob < ApplicationJob
  queue_as :default

  def perform(job_status_id, race_id)
    job_status = JobStatus.find(job_status_id)

    begin
      race = Race.find(race_id)

      routes = race.routes.complete.includes(legs: [:start, :finish])
      n = routes.size
      job_status.update!(total: n)

      if n == 0
        job_status.complete!(message: "Ranked 0 routes")
        return
      end

      num_stops = race.num_stops

      # Build location sequences for all routes
      sequences = routes.map do |r|
        locations = r.legs.map { |l| l.start.id } + [r.legs.last.finish.id]
        # Only intermediate CPs: indices 1..num_stops (skip index 0=start, skip last=finish)
        locations[1..num_stops]
      end

      # Build frequency matrix: freq[position_index][location_id] = count
      freq = Array.new(num_stops) { Hash.new(0) }
      sequences.each do |seq|
        seq.each_with_index do |loc_id, pos|
          freq[pos][loc_id] += 1
        end
      end

      # Score each route
      routes.each_with_index do |route, i|
        seq = sequences[i]
        raw_score = seq.each_with_index.sum do |loc_id, pos|
          1.0 - (freq[pos][loc_id].to_f / n)
        end
        normalized = (raw_score / num_stops) * 100
        route.update_column(:rarity_score, normalized.round(1))
        job_status.tick!(message: "Scored route #{i + 1}/#{n}")
      end

      job_status.complete!(message: "Ranked #{n} route#{'s' unless n == 1}")
    rescue => e
      job_status.fail!(message: e.message)
      raise
    end
  end
end
