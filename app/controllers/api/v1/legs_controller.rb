# frozen_string_literal: true

module Api
  module V1
    class LegsController < BaseController
      def index
        legs = if params[:race_id].present?
                 race = Race.find(params[:race_id])
                 Leg.valid_for_race(race)
               else
                 Leg.all
               end
        legs = legs.includes(:start, :finish).order(:id)
        render json: {
          count: legs.count,
          legs: legs.limit(params.fetch(:limit, 100).to_i).map { |l| serialize_leg(l) }
        }
      end

      def race_legs
        race = Race.find(params[:race_id])
        race_location_ids = race.locations.pluck(:id)
        legs = Leg.where(start_id: race_location_ids, finish_id: race_location_ids)
                   .includes(:start, :finish)
                   .order(:id)
        render json: legs.map { |l| serialize_race_leg(l, race) }
      end

      def destroy
        if params[:id] == 'all'
          count = Leg.count
          Leg.delete_all
          render json: { message: "Deleted #{count} legs" }
        else
          leg = Leg.find(params[:id])
          leg.destroy!
          render json: { message: "Leg deleted" }
        end
      end

      private

      def serialize_leg(l)
        {
          id: l.id,
          start: { id: l.start.id, name: l.start.name },
          finish: { id: l.finish.id, name: l.finish.name },
          distance: l.distance,
          created_at: l.created_at
        }
      end

      def serialize_race_leg(l, race)
        {
          id: l.id,
          start_id: l.start.id,
          finish_id: l.finish.id,
          start_name: l.start.name,
          finish_name: l.finish.name,
          distance: l.distance,
          distance_display: Distances.m_to_s(l.distance, race.distance_unit)
        }
      end
    end
  end
end
