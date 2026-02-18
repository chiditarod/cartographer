# frozen_string_literal: true

FactoryBot.define do
  factory :location do
    name { Faker::Nation.unique.capital_city }
    street_address { Faker::Address.unique.street_address }
    city { Faker::Address.city }
    state { Faker::Address.state_abbr }
    zip { Random.rand(99999) }
    max_capacity { 150 }
    ideal_capacity { 100 }

    trait :with_lat_lng do
      sequence(:lat)
      sequence(:lng)
    end
  end
end
