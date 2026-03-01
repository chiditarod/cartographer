class RenameBlankTimecardsPerRouteToExtraTimecards < ActiveRecord::Migration[8.0]
  def change
    rename_column :races, :blank_timecards_per_route, :extra_timecards
  end
end
