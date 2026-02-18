# frozen_string_literal: true

module Api
  module V1
    class RoutesController < BaseController
      def index
        race = Race.find(params[:race_id])
        routes = race.routes.complete.includes(legs: [:start, :finish])
        render json: routes.map { |r| serialize_route(r) }
      end

      def show
        race = Race.find(params[:race_id])
        route = race.routes.find(params[:id])
        render json: serialize_route(route, include_details: true)
      end

      def update
        race = Race.find(params[:race_id])
        route = race.routes.find(params[:id])
        route.update!(route_params)
        render json: serialize_route(route)
      end

      def destroy
        race = Race.find(params[:race_id])
        route = race.routes.find(params[:id])
        # legs_routes has no primary key, so delete join records via SQL
        LegsRoute.where(route_id: route.id).delete_all
        route.delete
        render json: { message: "Route deleted" }
      end

      private

      def route_params
        params.require(:route).permit(:name)
      end

      def serialize_route(r, include_details: false)
        data = {
          id: r.id,
          name: r.name,
          race_id: r.race_id,
          complete: r.complete,
          distance: r.distance,
          distance_unit: r.race.distance_unit,
          leg_count: r.legs.size,
          target_leg_count: r.target_leg_count,
          created_at: r.created_at
        }
        if include_details
          data[:legs] = r.legs.map { |l|
            {
              id: l.id,
              start: { id: l.start.id, name: l.start.name, lat: l.start.lat, lng: l.start.lng },
              finish: { id: l.finish.id, name: l.finish.name, lat: l.finish.lat, lng: l.finish.lng },
              distance: l.distance,
              distance_display: Distances.m_to_s(l.distance, r.race.distance_unit)
            }
          }
          data[:map_url] = r.to_google_map
          data[:csv] = r.to_csv
        end
        data
      end
    end
  end
end
