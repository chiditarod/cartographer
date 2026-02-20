# frozen_string_literal: true

FactoryBot.define do
  factory :team do
    race
    name { "Team #{rand(10000)}" }
    bib_number { rand(1..9999) }
  end
end
