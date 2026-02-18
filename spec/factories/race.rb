# frozen_string_literal: true

FactoryBot.define do
  factory :race do
    name { "Race #{rand(10000)}" }
    num_stops { 2 }
    max_teams { 5 }
    people_per_team { 5 }
    min_total_distance { 2.5 }
    max_total_distance { 3.5 }
    min_leg_distance { 0.8 }
    max_leg_distance { 1.2 }
    association :start, factory: :location
    association :finish, factory: :location

    after(:create) do |race, evaluator|
      race.locations.append(race.start, race.finish)
    end

    trait :with_locations do
      transient do
        count { num_stops }
      end

      after(:create) do |race, evaluator|
        evaluator.count.times do |n|
          race.locations << FactoryBot.create(:location)
        end
      end
    end
  end
end
