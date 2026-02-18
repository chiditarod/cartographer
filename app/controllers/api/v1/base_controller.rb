# frozen_string_literal: true

module Api
  module V1
    class BaseController < ActionController::API
      rescue_from ActiveRecord::RecordNotFound, with: :not_found
      rescue_from ActiveRecord::RecordInvalid, with: :unprocessable_entity_error

      private

      def not_found(exception)
        render json: { error: exception.message }, status: :not_found
      end

      def unprocessable_entity_error(exception)
        render json: {
          error: exception.message,
          errors: exception.record&.errors&.full_messages
        }, status: :unprocessable_entity
      end
    end
  end
end
