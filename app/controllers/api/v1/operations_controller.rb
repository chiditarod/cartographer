# frozen_string_literal: true

module Api
  module V1
    class OperationsController < BaseController
      def generate_legs
        race = Race.find(params[:race_id])
        location_ids = race.location_ids

        test_mode = if params[:mock].present? || ENV['MOCK_MAP']
                      { min: race.min_leg_distance_m.to_i, max: race.max_leg_distance_m.to_i }
                    else
                      false
                    end

        job_status = JobStatus.create!(
          job_type: 'generate_legs',
          status: 'running',
          metadata: { race_id: race.id, location_count: location_ids.size }
        )

        GenerateLegsJob.perform_later(job_status.id, location_ids, test_mode)

        render json: { job_status_id: job_status.id }, status: :accepted
      end

      def generate_routes
        race = Race.find(params[:race_id])

        job_status = JobStatus.create!(
          job_type: 'generate_routes',
          status: 'running',
          metadata: { race_id: race.id }
        )

        GenerateRoutesJob.perform_later(job_status.id, race.id)

        render json: { job_status_id: job_status.id }, status: :accepted
      end

      def rank_routes
        race = Race.find(params[:race_id])

        job_status = JobStatus.create!(
          job_type: 'rank_routes',
          status: 'running',
          metadata: { race_id: race.id }
        )

        RankRoutesJob.perform_later(job_status.id, race.id)

        render json: { job_status_id: job_status.id }, status: :accepted
      end

      def auto_select
        race = Race.find(params[:race_id])
        count = params[:count].to_i
        complete_count = race.routes.complete.count

        if count <= 0 || count > complete_count
          return render json: { error: "Count must be between 1 and #{complete_count}" }, status: :unprocessable_entity
        end

        route_ids = RouteBalancer.call(race, count)
        render json: { route_ids: route_ids }
      end

      def geocode
        location_ids = params[:location_ids]

        job_status = JobStatus.create!(
          job_type: 'geocode',
          status: 'running',
          metadata: { location_count: location_ids.size }
        )

        GeocodeLocationsJob.perform_later(job_status.id, location_ids)

        render json: { job_status_id: job_status.id }, status: :accepted
      end
    end
  end
end
