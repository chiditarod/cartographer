# frozen_string_literal: true

module Api
  module V1
    class TeamsController < BaseController
      def index
        race = Race.find(params[:race_id])
        teams = race.teams.includes(:route).order(:dogtag_id)
        render json: teams.map { |t| serialize_team(t) }
      end

      def create
        race = Race.find(params[:race_id])
        team = race.teams.create!(team_params)
        render json: serialize_team(team), status: :created
      end

      def update
        race = Race.find(params[:race_id])
        team = race.teams.find(params[:id])
        team.update!(team_params)
        render json: serialize_team(team.reload)
      end

      def destroy
        race = Race.find(params[:race_id])
        if params[:id] == "all"
          count = race.teams.count
          race.teams.destroy_all
          render json: { message: "Deleted #{count} teams" }
        else
          team = race.teams.find(params[:id])
          team.destroy!
          render json: { message: "Team deleted" }
        end
      end

      def import_csv
        race = Race.find(params[:race_id])
        unless params[:file].present?
          render json: { error: "No file uploaded" }, status: :unprocessable_entity
          return
        end

        csv_text = params[:file].read
        result = TeamCsvImporter.call(race, csv_text)
        render json: result
      rescue TeamCsvImporter::ImportError => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      def bulk_assign
        race = Race.find(params[:race_id])
        raw = params[:assignments] || []
        assignments = raw.select { |a| a.respond_to?(:permit) }.map { |a| a.permit(:team_id, :route_id) }

        ActiveRecord::Base.transaction do
          race.teams.update_all(route_id: nil)
          assignments.each do |assignment|
            team = race.teams.find(assignment["team_id"])
            team.update!(route_id: assignment["route_id"])
          end
        end

        teams = race.teams.includes(:route).order(:dogtag_id)
        render json: teams.map { |t| serialize_team(t) }
      end

      def clear_bibs
        race = Race.find(params[:race_id])
        race.teams.update_all(bib_number: nil)
        teams = race.teams.includes(:route).order(:dogtag_id)
        render json: teams.map { |t| serialize_team(t) }
      end

      private

      def team_params
        params.require(:team).permit(:name, :dogtag_id, :bib_number, :route_id)
      end

      def serialize_team(t)
        {
          id: t.id,
          name: t.name,
          dogtag_id: t.dogtag_id,
          bib_number: t.bib_number,
          display_number: t.display_number,
          race_id: t.race_id,
          route_id: t.route_id,
          route_name: t.route&.name
        }
      end
    end
  end
end
