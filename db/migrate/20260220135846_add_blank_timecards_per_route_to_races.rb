class AddBlankTimecardsPerRouteToRaces < ActiveRecord::Migration[8.0]
  def change
    add_column :races, :blank_timecards_per_route, :integer, default: 0, null: false
  end
end
