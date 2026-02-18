# frozen_string_literal: true

module Api
  module V1
    class RacesController < BaseController
      def index
        races = Race.order(:name)
        render json: races.map { |r| serialize_race(r) }
      end

      def show
        race = Race.find(params[:id])
        render json: serialize_race(race, include_details: true)
      end

      def create
        race = Race.new(race_params)
        race.save!
        assign_locations(race) if params[:race][:location_ids].present?
        render json: serialize_race(race), status: :created
      end

      def update
        race = Race.find(params[:id])
        race.update!(race_params)
        assign_locations(race) if params[:race]&.key?(:location_ids)
        render json: serialize_race(race)
      end

      def destroy
        race = Race.find(params[:id])
        race.destroy!
        render json: { message: "Race deleted" }
      end

      def duplicate
        original = Race.find(params[:id])
        copy = original.dup
        copy.name = "Copy of #{original.name}"
        copy.save!
        copy.locations = original.locations
        render json: serialize_race(copy), status: :created
      end

      private

      def assign_locations(race)
        race.locations = Location.where(id: params[:race][:location_ids])
      end

      def race_params
        params.require(:race).permit(
          :name, :num_stops, :max_teams, :people_per_team,
          :min_total_distance, :max_total_distance,
          :min_leg_distance, :max_leg_distance,
          :start_id, :finish_id, :distance_unit
        )
      end

      def serialize_race(r, include_details: false)
        data = {
          id: r.id,
          name: r.name,
          num_stops: r.num_stops,
          max_teams: r.max_teams,
          people_per_team: r.people_per_team,
          min_total_distance: r.min_total_distance,
          max_total_distance: r.max_total_distance,
          min_leg_distance: r.min_leg_distance,
          max_leg_distance: r.max_leg_distance,
          start_id: r.start_id,
          finish_id: r.finish_id,
          distance_unit: r.distance_unit,
          location_ids: r.location_ids,
          route_count: r.routes.where(complete: true).count,
          created_at: r.created_at,
          updated_at: r.updated_at
        }
        if include_details
          data[:start] = { id: r.start.id, name: r.start.name }
          data[:finish] = { id: r.finish.id, name: r.finish.name }
          data[:locations] = r.locations.order(:name).map { |l|
            { id: l.id, name: l.name, street_address: l.street_address }
          }
          data[:leg_count] = Leg.valid_for_race(r).count
        end
        data
      end
    end
  end
end
