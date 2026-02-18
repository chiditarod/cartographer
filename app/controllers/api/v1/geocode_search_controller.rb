# frozen_string_literal: true

module Api
  module V1
    class GeocodeSearchController < BaseController
      def search
        query = params[:query].to_s.strip
        return render json: { error: 'Query is required' }, status: :bad_request if query.blank?

        results = if ENV['MOCK_MAP']
          mock_results(query)
        else
          google_results(query)
        end

        render json: results
      end

      private

      def mock_results(query)
        [
          {
            formatted_address: "#{query}, Chicago, IL 60601, USA",
            name: query,
            street_address: "123 #{query} St",
            city: 'Chicago',
            state: 'IL',
            zip: '60601',
            country: 'US',
            lat: 41.87 + rand(-0.03..0.03),
            lng: -87.63 + rand(-0.03..0.03)
          }
        ]
      end

      def google_results(query)
        client = GoogleApiClient.new.client
        response = client.geocode(query)

        response.map do |result|
          components = result[:address_components] || []
          geo = result.dig(:geometry, :location) || {}

          {
            formatted_address: result[:formatted_address],
            name: result[:formatted_address]&.split(',')&.first,
            street_address: extract_component(components, 'street_number', 'route'),
            city: find_component(components, 'locality'),
            state: find_component(components, 'administrative_area_level_1', short: true),
            zip: find_component(components, 'postal_code'),
            country: find_component(components, 'country', short: true),
            lat: geo[:lat],
            lng: geo[:lng]
          }
        end
      end

      def extract_component(components, *types)
        parts = types.map { |type| find_component(components, type) }.compact
        parts.join(' ').presence
      end

      def find_component(components, type, short: false)
        comp = components.find { |c| c[:types]&.include?(type) }
        return nil unless comp
        short ? comp[:short_name] : comp[:long_name]
      end
    end
  end
end
