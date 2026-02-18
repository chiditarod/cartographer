# frozen_string_literal: true

class GeocodeLocationsJob < ApplicationJob
  queue_as :default

  def perform(job_status_id, location_ids)
    job_status = JobStatus.find(job_status_id)
    job_status.update!(total: location_ids.size, status: 'running')

    begin
      location_ids.each_with_index do |id, i|
        loc = Location.find(id)
        if loc.lat.present? && loc.lng.present?
          job_status.tick!(message: "Skipped #{loc.name} (already geocoded)")
          next
        end

        if ENV['MOCK_MAP']
          loc.update!(lat: 41.87 + rand(-0.03..0.03), lng: -87.63 + rand(-0.03..0.03))
        else
          response = GoogleApiClient.new.client.geocode(loc.full_address)
          data = response.first.dig(:geometry, :location)
          loc.update!(lat: data[:lat], lng: data[:lng])
        end
        job_status.tick!(message: "Geocoded #{loc.name} (#{i + 1}/#{location_ids.size})")
      end

      job_status.complete!(message: "Geocoding complete")
    rescue => e
      job_status.fail!(message: e.message)
      raise
    end
  end
end
