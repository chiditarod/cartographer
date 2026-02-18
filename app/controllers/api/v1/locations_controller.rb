# frozen_string_literal: true

module Api
  module V1
    class LocationsController < BaseController
      def index
        locations = Location.order(:name)
        render json: locations.map { |l| serialize_location(l) }
      end

      def show
        location = Location.find(params[:id])
        render json: serialize_location(location)
      end

      def create
        location = Location.new(location_params)
        location.save!
        render json: serialize_location(location), status: :created
      end

      def update
        location = Location.find(params[:id])
        location.update!(location_params)
        render json: serialize_location(location)
      end

      def destroy
        location = Location.find(params[:id])
        location.destroy!
        render json: { message: "Location deleted" }
      end

      private

      def location_params
        params.require(:location).permit(
          :name, :street_address, :city, :state, :zip, :country,
          :lat, :lng, :max_capacity, :ideal_capacity
        )
      end

      def serialize_location(l)
        {
          id: l.id,
          name: l.name,
          street_address: l.street_address,
          city: l.city,
          state: l.state,
          zip: l.zip,
          country: l.country,
          lat: l.lat,
          lng: l.lng,
          max_capacity: l.max_capacity,
          ideal_capacity: l.ideal_capacity,
          full_address: l.full_address,
          geocoded: l.lat.present? && l.lng.present?,
          created_at: l.created_at,
          updated_at: l.updated_at
        }
      end
    end
  end
end
