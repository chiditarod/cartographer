# frozen_string_literal: true

FactoryBot.define do
  factory :team do
    race
    name { "Team #{rand(10000)}" }
    dogtag_id { rand(1..9999) }
  end
end
