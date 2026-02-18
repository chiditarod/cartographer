# frozen_string_literal: true

module Api
  module V1
    class JobStatusesController < BaseController
      def show
        job_status = JobStatus.find(params[:id])
        render json: {
          id: job_status.id,
          job_type: job_status.job_type,
          status: job_status.status,
          progress: job_status.progress,
          total: job_status.total,
          message: job_status.message,
          metadata: job_status.metadata,
          created_at: job_status.created_at,
          updated_at: job_status.updated_at
        }
      end
    end
  end
end
