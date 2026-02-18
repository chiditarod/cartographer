# frozen_string_literal: true

class CreateJobStatuses < ActiveRecord::Migration[8.0]
  def change
    create_table :job_statuses do |t|
      t.string :job_type, null: false
      t.string :status, null: false, default: 'pending'
      t.integer :progress, default: 0
      t.integer :total, default: 0
      t.string :message
      t.jsonb :metadata, default: {}
      t.timestamps
    end

    add_index :job_statuses, :status
    add_index :job_statuses, :created_at
  end
end
