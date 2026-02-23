# frozen_string_literal: true

module Api
  module V1
    class CheckinCardsController < BaseController
      def export_pdf
        race = Race.find(params[:race_id])
        teams = race.teams.where.not(route_id: nil).order(:dogtag_id)

        if teams.empty?
          render json: { error: "No teams are assigned to routes" }, status: :unprocessable_entity
          return
        end

        pdf_data = CheckinCardPdfService.call(
          race, teams,
          blank_count: race.blank_checkin_cards
        )

        send_data pdf_data,
                  filename: "race-#{race.id}-checkin-cards.pdf",
                  type: "application/pdf",
                  disposition: "attachment"
      end
    end
  end
end
