class Race < ApplicationRecord
  validates :num_stops, :max_teams, :people_per_team,
    numericality: { only_integer: true }
  validates :min_total_distance, :max_total_distance, :min_leg_distance, :max_leg_distance,
    numericality: true

  #validates_uniqueness_of :locations

  # TODO: validate that start and end are in the location pool

  belongs_to :start, class_name: "Location"
  belongs_to :finish, class_name: "Location"
  has_and_belongs_to_many :locations
  has_many :routes

  enum :distance_unit, { mi: 0, km: 1 }

  def to_s
    "#{name}; stops: #{num_stops}; race min/max #{min_total_distance}/#{max_total_distance} #{distance_unit}; leg min/max #{min_leg_distance}/#{max_leg_distance} #{distance_unit}"
  end

  # helper functions to return meters

  def min_total_distance_m
    mi? ? Distances.mi_to_m(min_total_distance) : min_total_distance * 1000
  end

  def max_total_distance_m
    mi? ? Distances.mi_to_m(max_total_distance) : max_total_distance * 1000
  end

  def min_leg_distance_m
    mi? ? Distances.mi_to_m(min_leg_distance) : min_leg_distance * 1000
  end

  def max_leg_distance_m
    mi? ? Distances.mi_to_m(max_leg_distance) : max_leg_distance * 1000
  end
end
