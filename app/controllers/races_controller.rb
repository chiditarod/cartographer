# frozen_string_literal: true

class RacesController < ApplicationController

  def routes
    race = Race.find(params[:race_id])
    @routes = Route.where(race_id: race.id).all.select(&:complete?)
  end
end
