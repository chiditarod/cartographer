# frozen_string_literal: true

class RoutesController < ApplicationController
  def index
    @race = Race.find(params[:race_id])
    @routes = Route.where(race_id: @race.id).complete
  end

  def show
    @race = Race.find(params[:race_id])
    @route = Route.find(params[:id])

    half = @route.legs.count / 2
    @left =  @route.legs.slice(1, half)
    @right = @route.legs.slice(half+1, @route.legs.size)
  end
end
