# frozen_string_literal: true

# Add geocode data to a location
class GeocodeLocationJob < ApplicationJob
  queue_as :default

  def perform(location_ids)
    location_ids.each do |id|
      geocode(id)
    end
  end

  def geocode(loc_id)
    loc = Location.find(loc_id)

    if loc.lat.present? && loc.lng.present?
      puts "Geocode data already present for location: #{loc.name}"
      return
    end

    response = GoogleApiClient.new.client.geocode(loc.full_address)
    data = response.first.dig(:geometry, :location)
    loc.lat = data[:lat]
    loc.lng = data[:lng]
    loc.save!
  end
end
