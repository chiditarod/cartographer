class AddSelectedToRoutes < ActiveRecord::Migration[8.0]
  def change
    add_column :routes, :selected, :boolean, default: false, null: false
  end
end
