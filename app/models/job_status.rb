# frozen_string_literal: true

class JobStatus < ApplicationRecord
  validates :job_type, presence: true
  validates :status, inclusion: { in: %w[pending running completed failed] }

  def percent_complete
    return 0 if total.nil? || total.zero?
    ((progress.to_f / total) * 100).round(1)
  end

  def complete!(message: nil)
    update!(status: 'completed', message: message, progress: total)
  end

  def fail!(message:)
    update!(status: 'failed', message: message)
  end

  def tick!(message: nil)
    increment!(:progress)
    update!(message: message) if message
  end
end
