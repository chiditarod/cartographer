# frozen_string_literal: true

module Api
  module V1
    class TimecardsController < BaseController
      def export_pdf
        race = Race.find(params[:race_id])
        teams = race.teams.where.not(route_id: nil).includes(route: { legs: [:start, :finish] })

        if teams.empty?
          render json: { error: "No teams are assigned to routes" }, status: :unprocessable_entity
          return
        end

        pairs = teams.map { |t| { team: t, route: t.route } }

        pdf_data = TimecardPdfService.call(
          race,
          pairs,
          extra_blank_count: race.extra_timecards
        )

        send_data pdf_data,
                  filename: "race-#{race.id}-timecards.pdf",
                  type: "application/pdf",
                  disposition: "attachment"
      end
    end
  end
end
