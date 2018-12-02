class CreateLocations < ActiveRecord::Migration[5.2]
  def change
    create_table :locations do |t|
      t.string :name, null: false
      t.integer :max_capacity, null: false
      t.integer :ideal_capacity, null: false
      t.string :street_address
      t.string :city
      t.string :state
      t.float :lat
      t.float :lon

      t.timestamps
    end
    add_index :locations, :name, unique: true
  end
end