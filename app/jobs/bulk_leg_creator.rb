# frozen_string_literal: true

class BulkLegCreator < ApplicationJob

  # including test_mode hash will prevent calls to google api
  # and use a random value within range instead. e.g.:
  # test_mode: { min: 12000, max: 18000 } # meters
  def perform(location_ids, test_mode=false)
    location_ids.each_with_index do |current, i|
      ids_without_current = location_ids.reject.with_index{|v, j| j == i }
      create_legs(current, ids_without_current, test_mode)
    end
  end

  private

  def create_legs(origin_id, destination_ids, test_mode)
    preexisting_legs = Leg.where(start_id: origin_id).map(&:finish_id)
    destinations = Location.where(id: destination_ids).
      reject { |l| preexisting_legs.include?(l.id) }

    return if destinations.empty?

    origin = Location.find(origin_id)

    if test_mode.is_a?(Hash)
      destinations.each do |dest|
        Leg.create(start: origin, finish: dest, distance: random_distance(test_mode))
      end
      return
    end

    client = GoogleApiClient.new.client
    resp = client.distance_matrix([origin.full_address],
                                  destinations.map(&:full_address),
                                  mode: 'walking',
                                  language: 'en-US',
                                  avoid: 'tolls',
                                  units: 'imperial')

    # we pass a single origin to return a single row w/ multiple elements
    # an optimization (to save $$$ via less API calls) is to pass multiple
    # origins and parse the multiple rows/elements
    resp.dig(:rows).first.dig(:elements).each_with_index do |elem, i|
      Leg.create(start: origin,
                 finish: destinations[i],
                 distance: elem.dig(:distance, :value))
    end
  end

  # TODO: optimize
  def random_distance(test_mode)
    val = Random.rand(test_mode[:max])
    while val < test_mode[:min]
      val = Random.rand(test_mode[:max])
    end
    val
  end
end
