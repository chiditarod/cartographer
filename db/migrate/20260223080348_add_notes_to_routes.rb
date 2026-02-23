class AddNotesToRoutes < ActiveRecord::Migration[8.0]
  def change
    add_column :routes, :notes, :text
  end
end
