# frozen_string_literal: true

class Route < ApplicationRecord
  belongs_to :race
  validates :race, presence: true

  has_many :legs_routes, -> { order('legs_routes.order') }, dependent: :delete_all
  has_many :legs, through: :legs_routes

  validate :validate_leg_distances,
           :validate_leg_locations_allowed_in_race,
           :validate_finish_is_at_end

  scope :complete, -> { where(complete: true).order(:name) }

  # once a certain # of legs are added, set a boolean attribute
  # on the record that enables additional validations from here on out
  before_validation :check_leg_threshold
  with_options if: :leg_threshold_crossed do |r|
    r.validate :validate_leg_count
    r.validate :validate_route_length
  end

  validate :validate_finish_is_at_end, if: :has_all_legs?
  validate :validate_finish_not_used_until_end, unless: :has_all_legs?

  before_save :set_complete_bool

  MAP_DEFAULT_ZOOM = 14
  MAP_START_ICON = "https://maps.google.com/mapfiles/kml/paddle/wht-stars.png"
  MAP_FINISH_ICON = "https://maps.google.com/mapfiles/kml/paddle/wht-stars.png"

  def complete?
    valid? && has_all_legs?
  end

  def has_all_legs?
    legs.size == target_leg_count
  end

  def target_leg_count
    race.num_stops + 1
  end

  def legs_needed
    target_leg_count - legs.size
  end

  def distance
    meters = legs.inject(0) { |memo, l| memo += l.distance }
    (race.mi? ? Distances.m_to_mi(meters) : meters / 1000).round(2)
  end

  def validate_route_uniqueness
  end

  def validate_leg_count
    unless legs.size == target_leg_count
      errors.add(:legs, "This race requires a route to have exactly #{race.num_stops + 1} legs (currently #{legs.size} legs)")
    end
  end

  def validate_finish_not_used_until_end
    return unless legs.size < target_leg_count

    if legs.map(&:finish).include?(race.finish)
      errors.add(:legs, "The race finish location: #{race.finish} cannot be used until the end")
    end
  end

  def validate_finish_is_at_end
    return unless legs.size == target_leg_count

    unless legs.last.finish == race.finish
      errors.add(:legs, "The last leg needs to finish at: #{race.finish}. Currently: #{legs.last.finish}")
    end
  end

  def validate_route_length
    total = legs.map(&:distance).reduce(&:+) || 0
    if total < race.min_total_distance_m
      errors.add(:legs, "Route length is too short (#{Distances.m_to_s(total, race.distance_unit)} < #{race.min_total_distance} #{race.distance_unit})")
    end
    if total > race.max_total_distance_m
      errors.add(:legs, "Route length is too long (#{Distances.m_to_s(total, race.distance_unit)} > #{race.max_total_distance} #{race.distance_unit})")
    end
  end

  # TODO: add descriptive leg details about each error found
  def validate_leg_distances
    distances = legs.map(&:distance)
    if distances.any? { |l| l < race.min_leg_distance_m }
      errors.add(:legs, "cannot use a leg with distance < #{race.min_leg_distance} #{race.distance_unit}")
    end

    if distances.any? { |l| l > race.max_leg_distance_m }
      errors.add(:legs, "cannot use a leg with distance > #{race.max_leg_distance} #{race.distance_unit}")
    end
  end

  # TODO: include the leg id and location names in the error
  def validate_leg_locations_allowed_in_race
    route_locations =
      legs.map(&:finish).map(&:id).
      concat(legs.map(&:start).map(&:id)).uniq

    invalid_locations = route_locations - (route_locations & race.locations.map(&:id))
    invalid_locations.each do |location_id|
      errors.add(:legs, "Location #{location_id} is used in a leg but is not allowed in this race")
    end
  end

  def to_s(unit=nil)
    return "EMPTY" if legs.size.zero?
    legs_arr = legs.to_a

    start_leg = legs_arr.slice!(0)
    prefix = "[#{legs.size}/#{target_leg_count} legs, #{distance.round(2)} #{race.distance_unit}]"
    legs_arr.inject("#{prefix} #{start_leg.to_s(race.distance_unit)}") do |memo, leg|
      memo + " --(#{Distances.m_to_s(leg.distance, race.distance_unit)})--> #{leg.finish}"
    end
  end

  # https://www.viget.com/articles/make-remote-files-local-with-ruby-tempfile/
  def fetch_google_map
  end

  def to_google_map(zoom=MAP_DEFAULT_ZOOM)
    return nil unless complete
    return "requires lat and lng" if legs.any? do |leg|
      leg.start.lat.nil? || leg.start.lng.nil? || leg.finish.lat.nil? || leg.finish.lng.nil?
    end

    return '/mock-route-map.png' if ENV['MOCK_MAP']

    start_icon = "https://maps.google.com/mapfiles/kml/paddle/wht-stars.png"
    finish_icon = "https://maps.google.com/mapfiles/kml/paddle/wht-stars.png"

    legs_arr = legs.to_a
    start_leg = legs_arr.slice!(0)

    prefix = "https://maps.googleapis.com/maps/api/staticmap?scale=2&zoom=#{zoom}&size=1024x768&style=feature:poi|visibility:off"

    start = "&markers=icon:#{start_icon}%7C#{start_leg.start.lat_lng}"
    legs = ""
    legs_arr.each_with_index do |leg, i|
      legs += "&markers=color:white%7Clabel:#{i+1}%7C#{leg.start.lat_lng}"
    end
    finish = "&markers=icon:#{finish_icon}%7C#{legs_arr.last.finish.lat_lng}"

    "#{prefix}#{start}#{legs}#{finish}&key=#{ENV['GOOGLE_API_KEY']}"
  end

  def to_csv(unit=nil)
    score = rarity_score.nil? ? '' : rarity_score

    if legs.size.zero?
      header = "Route ID,Leg Count,Target Leg Count,Rarity Score,Unit"
      return "#{header}\n0,0,0,#{score},#{race.distance_unit}"
    end

    legs_arr = legs.to_a
    start_leg = legs_arr.slice!(0)

    header_parts = ["Route ID", "Leg Count", "Target Leg Count", "Total Distance", "Rarity Score", "Unit", "Start"]
    (1..legs.size).each do |i|
      header_parts << "Leg #{i} Distance"
      header_parts << (i == legs.size ? "Finish" : "Stop #{i}")
    end

    prefix = "#{self.id},#{legs.size},#{target_leg_count},#{distance.round(2)},#{score},#{race.distance_unit}"
    data = legs_arr.inject("#{prefix},#{start_leg.to_csv(race.distance_unit)}") do |memo, leg|
      memo + ",#{Distances.m_to_s(leg.distance, race.distance_unit)},#{leg.finish}"
    end

    "#{header_parts.join(",")}\n#{data}"
  end

  private

  def set_complete_bool
    return if self.complete
    if self.complete?
      self.complete = true
    end
  end

  def check_leg_threshold
    self.leg_threshold_crossed ||= (legs.size >= target_leg_count)
  end
end
