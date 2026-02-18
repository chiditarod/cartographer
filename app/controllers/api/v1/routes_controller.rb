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

      def export_pdf
        race = Race.find(params[:race_id])
        route = race.routes.find(params[:id])
        pdf_data = RoutePdfService.call(route)
        send_data pdf_data,
                  filename: "route-#{route.id}.pdf",
                  type: "application/pdf",
                  disposition: "attachment"
      end

      def export_csv
        race = Race.find(params[:race_id])
        routes = race.routes.complete.includes(legs: [:start, :finish])
        routes = routes.where(id: params[:ids].split(',')) if params[:ids].present?

        csv_lines = routes.map { |r| r.to_csv.split("\n", 2) }
        header = csv_lines.first&.first || ''
        data_rows = csv_lines.map(&:last)
        csv_content = ([header] + data_rows).join("\n")

        send_data csv_content, filename: "race-#{race.id}-routes.csv", type: 'text/csv'
      end

      def destroy
        race = Race.find(params[:race_id])
        if params[:id] == 'all'
          count = race.routes.count
          race.routes.destroy_all
          render json: { message: "Deleted #{count} routes" }
        elsif params[:id] == 'bulk'
          routes = race.routes.where(id: params[:ids])
          count = routes.count
          routes.destroy_all
          render json: { message: "Deleted #{count} routes" }
        else
          route = race.routes.find(params[:id])
          route.destroy!
          render json: { message: "Route deleted" }
        end
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
          rarity_score: r.rarity_score,
          created_at: r.created_at,
          location_sequence: if r.legs.any?
            r.legs.map { |l| { id: l.start.id, name: l.start.name } } +
              [{ id: r.legs.last.finish.id, name: r.legs.last.finish.name }]
          else
            []
          end
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
