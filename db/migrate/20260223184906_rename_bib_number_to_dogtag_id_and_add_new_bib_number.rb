# frozen_string_literal: true

class RenameBibNumberToDogtagIdAndAddNewBibNumber < ActiveRecord::Migration[8.0]
  def change
    rename_column :teams, :bib_number, :dogtag_id
    add_column :teams, :bib_number, :integer, null: true
    add_index :teams, [:race_id, :bib_number], unique: true, where: "bib_number IS NOT NULL",
      name: "index_teams_on_race_id_and_bib_number"
  end
end
