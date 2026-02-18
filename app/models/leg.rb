# frozen_string_literal: true

class Leg < ApplicationRecord
  validates :distance, numericality: true  # in meters
  belongs_to :start, class_name: "Location"
  belongs_to :finish, class_name: "Location"

  has_many :legs_routes
  has_many :routes, through: :legs_routes

  validates_associated :routes

  before_validation :fetch_distance, unless: Proc.new { distance.present? }
  after_save :create_mirror_leg

  # TODO: This belongs in a decorator
  def to_s(unit=nil)
    "#{start || '?' } --(#{Distances.m_to_s(distance, unit)})--> #{finish || '?'}"
  end

  def self.csv_header
    "Start,Distance,Finish"
  end

  def to_csv(unit=nil)
    "#{start || '?' },#{Distances.m_to_s(distance, unit)},#{finish || '?'}"
  end

  # find Legs where the start and finish location are
  # both contained in the parent race's location pool
  # TODO: Rename to in_race
  scope :valid_for_race, ->(race) do
    ids = Race.find(race.id).locations.map(&:id)
    where("start_id IN (?) AND finish_id IN (?)", ids, ids)
  end

  def fetch_distance
    client = GoogleApiClient.new.client
    resp = client.distance_matrix(
      [start.full_address],
      [finish.full_address],
      mode: 'walking',
      language: 'en-US',
      avoid: 'tolls',
      units: 'imperial')

    self.distance = resp.dig(:rows).first.dig(:elements).first.dig(:distance, :value)
  end

  # the current model is to "duplicate" a leg twice, using
  # each location as a starting point and finish point.
  # A future optimization can be to de-dupe these records, using a single
  # record to represent the leg between both locations
  def create_mirror_leg
    return if Leg.where(start: finish, finish: start).present?
    Leg.create start: finish, finish: start, distance: distance
  end
end
