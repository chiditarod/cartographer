# frozen_string_literal: true

class GenerateRoutesJob < ApplicationJob
  queue_as :default

  def perform(job_status_id, race_id)
    job_status = JobStatus.find(job_status_id)
    race = Race.find(race_id)

    initial_count = Route.where(race: race, complete: true).count
    job_status.update!(status: 'running', message: "Starting route generation...")

    begin
      RouteGenerator.call(race)

      final_count = Route.where(race: race, complete: true).count
      new_routes = final_count - initial_count
      job_status.update!(total: new_routes, progress: new_routes)
      job_status.complete!(message: "Generated #{new_routes} complete routes (#{final_count} total)")
    rescue => e
      job_status.fail!(message: e.message)
      raise
    end
  end
end
