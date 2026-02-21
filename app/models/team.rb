# frozen_string_literal: true

class Team < ApplicationRecord
  belongs_to :race
  belongs_to :route, optional: true

  validates :name, presence: true
  validates :bib_number, presence: true,
    numericality: { only_integer: true, greater_than: 0 },
    uniqueness: { scope: :race_id }

  validate :route_belongs_to_race

  private

  def route_belongs_to_race
    return unless route_id.present? && route.present?

    unless route.race_id == race_id
      errors.add(:route, "must belong to the same race")
    end
  end
end
