# frozen_string_literal: true

namespace :e2e do
  desc "Seed test data for Playwright E2E tests"
  task seed: :environment do
    unique_id = ENV.fetch('TEST_UNIQUE_ID', Time.now.to_i.to_s)
    short_id = unique_id[0..7]

    locations_data = [
      { name: "E2E Cobra Lounge #{short_id}", street_address: '235 N Ashland Ave', city: 'Chicago', state: 'IL', zip: 60607, country: 'USA', max_capacity: 400, ideal_capacity: 250, lat: 41.8863, lng: -87.6668 },
      { name: "E2E Output #{short_id}", street_address: '1758 W Grand Ave', city: 'Chicago', state: 'IL', zip: 60622, country: 'USA', max_capacity: 200, ideal_capacity: 150, lat: 41.8912, lng: -87.6729 },
      { name: "E2E Five Star #{short_id}", street_address: '1424 W Chicago Ave', city: 'Chicago', state: 'IL', zip: 60642, country: 'USA', max_capacity: 300, ideal_capacity: 200, lat: 41.8958, lng: -87.6644 },
      { name: "E2E Phyllis #{short_id}", street_address: '1800 W Division St', city: 'Chicago', state: 'IL', zip: 60622, country: 'USA', max_capacity: 200, ideal_capacity: 150, lat: 41.9030, lng: -87.6737 },
      { name: "E2E Roots #{short_id}", street_address: '1924 W Chicago Ave', city: 'Chicago', state: 'IL', zip: 60622, country: 'USA', max_capacity: 400, ideal_capacity: 250, lat: 41.8960, lng: -87.6775 },
      { name: "E2E Midwest Coast #{short_id}", street_address: '2137 W Walnut St', city: 'Chicago', state: 'IL', zip: 60612, country: 'USA', max_capacity: 500, ideal_capacity: 400, lat: 41.8862, lng: -87.6806 }
    ]

    created_locations = locations_data.map { |data| Location.create!(data) }
    cobra = created_locations.first

    Race.create!(
      name: "E2E Race #{short_id}",
      start: cobra,
      finish: cobra,
      locations: created_locations,
      num_stops: 5,
      max_teams: 150,
      people_per_team: 5,
      min_total_distance: 4.2,
      max_total_distance: 5.7,
      min_leg_distance: 0.4,
      max_leg_distance: 1.75,
      distance_unit: 'mi'
    )

    puts "E2E seed complete (unique_id: #{unique_id}, short: #{short_id})"
  end

  desc "Clean E2E test data"
  task clean: :environment do
    Route.destroy_all
    LegsRoute.delete_all
    Leg.delete_all
    Race.destroy_all
    Location.destroy_all
    JobStatus.destroy_all
    puts "E2E data cleaned"
  end
end
