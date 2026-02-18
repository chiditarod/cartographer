# frozen_string_literal: true

class AddPrimaryKeyToLegsRoutes < ActiveRecord::Migration[8.0]
  def up
    execute "ALTER TABLE legs_routes ADD COLUMN id BIGSERIAL PRIMARY KEY"
  end

  def down
    remove_column :legs_routes, :id
  end
end
