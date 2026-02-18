# frozen_string_literal: true

module Api
  module V1
    class StatsController < BaseController
      def index
        render json: {
          locations: Location.count,
          races: Race.count,
          legs: Leg.count,
          routes: Route.count,
          complete_routes: Route.where(complete: true).count
        }
      end
    end
  end
end
