class CreateTeams < ActiveRecord::Migration[8.0]
  def change
    create_table :teams do |t|
      t.references :race, null: false, foreign_key: true
      t.references :route, foreign_key: true
      t.string :name, null: false
      t.integer :bib_number, null: false

      t.timestamps
    end

    add_index :teams, [:race_id, :bib_number], unique: true
  end
end
