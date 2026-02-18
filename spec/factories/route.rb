# frozen_string_literal: true

FactoryBot.define do
  factory :route do
    race

    # TODO: try to leverage with_lat_lng trait in location factory
    trait :with_lat_lng do
      after(:create) do |route, evaluator|
        route.legs.each do |leg|
          leg.start.lat = leg.start.id + 1
          leg.start.lng = leg.start.id + 2
          leg.start.save!
        end
        finish = route.legs.last.finish
        finish.lat = finish.id + 1
        finish.lng = finish.id + 2
        finish.save!
      end
    end

    factory :incomplete_route do
      after(:create) do |route, evaluator|
        # start
        route.legs << FactoryBot.create(:leg, start: route.race.start)
        # middle legs (all minus 1 to make incomplete route)
        (route.race.num_stops - 1).times do
          route.legs << FactoryBot.create(:leg, start: route.legs.last.finish)
        end
        # omit finish line intentionally

        # add all of the locations created above into the location pool for the race
        route.race.locations = route.legs.map(&:start).concat(route.legs.map(&:finish)).uniq
        route.save
      end
    end

    factory :sequential_route do
      after(:create) do |route, evaluator|
        # start
        route.legs << FactoryBot.create(:leg, start: route.race.start)
        # middle legs
        (route.race.num_stops - 1).times do
          route.legs << FactoryBot.create(:leg, start: route.legs.last.finish)
        end
        # finish
        route.legs << FactoryBot.create(:leg, start: route.legs.last.finish, finish: route.race.finish)

        # add all of the locations created above into the location pool for the race
        route.race.locations = route.legs.map(&:start).concat(route.legs.map(&:finish)).uniq
        route.save
      end
    end
  end
end
