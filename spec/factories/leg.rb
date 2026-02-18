# frozen_string_literal: true

FactoryBot.define do
  factory :leg do
    association :start, factory: :location
    association :finish, factory: :location
    distance { 1609 } # 1 mi = 1609.34 meters
  end
end
