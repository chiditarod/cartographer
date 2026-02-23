# frozen_string_literal: true

class Team < ApplicationRecord
  belongs_to :race
  belongs_to :route, optional: true

  validates :name, presence: true
  validates :dogtag_id, presence: true,
    numericality: { only_integer: true, greater_than: 0 },
    uniqueness: { scope: :race_id }
  validates :bib_number,
    numericality: { only_integer: true, greater_than: 0 },
    uniqueness: { scope: :race_id, allow_nil: true },
    allow_nil: true

  validate :route_belongs_to_race

  def display_number
    bib_number || dogtag_id
  end

  private

  def route_belongs_to_race
    return unless route_id.present? && route.present?

    unless route.race_id == race_id
      errors.add(:route, "must belong to the same race")
    end
  end
end
