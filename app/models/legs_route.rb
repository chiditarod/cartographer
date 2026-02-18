# frozen_string_literal: true

class LegsRoute < ApplicationRecord
  belongs_to :leg
  belongs_to :route

  before_validation do
    last = LegsRoute.where(route: route).order(:order).select(:order).last
    self.order = last.nil? ? 1 : last.order + 1
  end

  def to_s
    "Leg: #{leg.id} Route: #{route.id rescue 'NIL!!!'}"
  end
end
