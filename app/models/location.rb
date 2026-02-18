# frozen_string_literal: true

class Location < ApplicationRecord
  validates :max_capacity, :ideal_capacity, numericality: { only_integer: true }
  validates :name, presence: true, uniqueness: true

  # allow either street address or lat/lng combo
  validates_presence_of :street_address, :city, :state, :zip, unless: Proc.new { lat.present? && lng.present? }
  validates_presence_of :lat, :lng, unless: Proc.new { street_address.present? && city.present? && state.present? && zip.present?  }

  #has_many :races_where_starting_line, class_name: "Race", foreign_key: "start_id"
  #has_many :races_where_finish_line, class_name: "Race", foreign_key: "finish_id"

  has_and_belongs_to_many :races

  #scope :used_as_starting_line, -> { joins(:races).where(races: { start_id: id }) }
  #scope :used_as_finish_line, -> { joins(:races).where(races: { finish_id: id }) }

  #scope :for_race, ->(race_id) { wh}

  def full_address
    "#{street_address} #{city} #{state} #{zip}"
  end

  def to_s
    name
  end

  def lat_lng
    if lat == nil || lng == nil
      return nil
    end
    "#{lat},#{lng}"
  end
end
