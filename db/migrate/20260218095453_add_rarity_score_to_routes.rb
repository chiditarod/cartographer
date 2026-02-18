class AddRarityScoreToRoutes < ActiveRecord::Migration[8.0]
  def change
    add_column :routes, :rarity_score, :decimal, precision: 5, scale: 1
  end
end
