# frozen_string_literal: true

class GenerateLegsJob < ApplicationJob
  queue_as :default

  def perform(job_status_id, location_ids, test_mode)
    job_status = JobStatus.find(job_status_id)
    job_status.update!(total: location_ids.size, status: 'running')

    begin
      location_ids.each_with_index do |current, i|
        ids_without_current = location_ids.reject.with_index { |_v, j| j == i }
        create_legs_for_origin(current, ids_without_current, test_mode)
        job_status.tick!(message: "Processed origin #{i + 1}/#{location_ids.size}")
      end

      leg_count = Leg.count
      job_status.complete!(message: "Created legs. Total legs: #{leg_count}")
    rescue => e
      job_status.fail!(message: e.message)
      raise
    end
  end

  private

  def create_legs_for_origin(origin_id, destination_ids, test_mode)
    preexisting_legs = Leg.where(start_id: origin_id).map(&:finish_id)
    destinations = Location.where(id: destination_ids)
                           .reject { |l| preexisting_legs.include?(l.id) }
    return if destinations.empty?

    origin = Location.find(origin_id)

    if test_mode.is_a?(Hash)
      destinations.each do |dest|
        val = rand(test_mode[:min]..test_mode[:max])
        Leg.create(start: origin, finish: dest, distance: val)
      end
      return
    end

    client = GoogleApiClient.new.client
    resp = client.distance_matrix(
      [origin.full_address],
      destinations.map(&:full_address),
      mode: 'walking', language: 'en-US', avoid: 'tolls', units: 'imperial'
    )

    resp.dig(:rows).first.dig(:elements).each_with_index do |elem, i|
      Leg.create(start: origin, finish: destinations[i],
                 distance: elem.dig(:distance, :value))
    end
  end
end
