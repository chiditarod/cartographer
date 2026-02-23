class AddCustomToRoutes < ActiveRecord::Migration[8.0]
  def change
    add_column :routes, :custom, :boolean, default: false, null: false
  end
end
