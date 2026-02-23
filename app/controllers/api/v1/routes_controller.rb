# frozen_string_literal: true

module Api
  module V1
    class RoutesController < BaseController
      def index
        race = Race.find(params[:race_id])
        routes = race.routes.complete.includes(legs: [:start, :finish])
        render json: routes.map { |r| serialize_route(r) }
      end

      def create
        race = Race.find(params[:race_id])
        location_ids = params.dig(:route, :location_ids) || []
        name = params.dig(:route, :name)

        # Build full sequence: start + intermediates + finish
        full_ids = [race.start_id] + location_ids.map(&:to_i) + [race.finish_id]

        # Validate all intermediate locations are in the race pool
        race_location_ids = race.locations.pluck(:id)
        invalid = full_ids - race_location_ids
        if invalid.any?
          render json: { error: "Locations not in race pool: #{invalid.join(', ')}" }, status: :unprocessable_entity
          return
        end

        # Look up legs for each consecutive pair
        legs = []
        full_ids.each_cons(2) do |start_id, finish_id|
          leg = Leg.find_by(start_id: start_id, finish_id: finish_id)
          unless leg
            start_name = Location.find(start_id).name rescue "ID #{start_id}"
            finish_name = Location.find(finish_id).name rescue "ID #{finish_id}"
            render json: { error: "No leg exists between #{start_name} and #{finish_name}" }, status: :unprocessable_entity
            return
          end
          legs << leg
        end

        route = Route.new(race: race, custom: true, name: name)
        route.save!
        legs.each { |leg| route.legs << leg }
        route.save!

        render json: serialize_route(route), status: :created
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
        if params[:id].present?
          route = race.routes.find(params[:id])
          pdf_data = RoutePdfService.call(route)
          send_data pdf_data,
                    filename: "route-#{route.id}.pdf",
                    type: "application/pdf",
                    disposition: "attachment"
        else
          routes = race.routes.complete.includes(legs: [:start, :finish])
          routes = routes.where(id: params[:ids].split(',')) if params[:ids].present?
          pdf_data = RoutePdfService.call_batch(routes.to_a)
          send_data pdf_data,
                    filename: "race-#{race.id}-routes.pdf",
                    type: "application/pdf",
                    disposition: "attachment"
        end
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

      def bulk_select
        race = Race.find(params[:race_id])
        ids = params[:ids] || []
        race.routes.where(selected: true).where.not(id: ids).update_all(selected: false)
        race.routes.where(id: ids).update_all(selected: true) if ids.any?
        render json: { selected_ids: ids.map(&:to_i) }
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
        params.require(:route).permit(:name, :selected, :notes)
      end

      def serialize_route(r, include_details: false)
        data = {
          id: r.id,
          name: r.name,
          race_id: r.race_id,
          complete: r.complete,
          custom: r.custom,
          distance: r.distance,
          distance_unit: r.race.distance_unit,
          leg_count: r.legs.size,
          target_leg_count: r.target_leg_count,
          rarity_score: r.rarity_score,
          selected: r.selected,
          notes: r.notes,
          created_at: r.created_at,
          location_sequence: if r.legs.any?
            r.legs.map { |l| { id: l.start.id, name: l.start.name } } +
              [{ id: r.legs.last.finish.id, name: r.legs.last.finish.name }]
          else
            []
          end,
          leg_distances: r.legs.map { |l|
            { distance: l.distance, distance_display: Distances.m_to_s(l.distance, r.race.distance_unit) }
          }
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
