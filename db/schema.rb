# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2020_02_17_065226) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "legs", force: :cascade do |t|
    t.float "distance", null: false
    t.integer "start_id", null: false
    t.integer "finish_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["start_id", "finish_id"], name: "index_legs_on_start_id_and_finish_id", unique: true
  end

  create_table "legs_routes", id: false, force: :cascade do |t|
    t.bigint "leg_id", null: false
    t.bigint "route_id", null: false
    t.integer "order", null: false
    t.index ["leg_id", "route_id", "order"], name: "index_legs_routes_on_leg_id_and_route_id_and_order", unique: true
    t.index ["leg_id"], name: "index_legs_routes_on_leg_id"
    t.index ["route_id"], name: "index_legs_routes_on_route_id"
  end

  create_table "locations", force: :cascade do |t|
    t.string "name", null: false
    t.integer "max_capacity", null: false
    t.integer "ideal_capacity", null: false
    t.string "street_address"
    t.string "city"
    t.string "state"
    t.integer "zip"
    t.string "country"
    t.float "lat"
    t.float "lng"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["lat", "lng"], name: "index_locations_on_lat_and_lng", unique: true
    t.index ["name"], name: "index_locations_on_name", unique: true
  end

  create_table "locations_races", id: false, force: :cascade do |t|
    t.bigint "location_id", null: false
    t.bigint "race_id", null: false
    t.index ["location_id"], name: "index_locations_races_on_location_id"
    t.index ["race_id"], name: "index_locations_races_on_race_id"
  end

  create_table "races", force: :cascade do |t|
    t.string "name", null: false
    t.integer "num_stops", null: false
    t.integer "max_teams", null: false
    t.integer "people_per_team", null: false
    t.float "min_total_distance", null: false
    t.float "max_total_distance", null: false
    t.float "min_leg_distance", null: false
    t.float "max_leg_distance", null: false
    t.integer "start_id"
    t.integer "finish_id"
    t.integer "distance_unit", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_races_on_name", unique: true
  end

  create_table "routes", force: :cascade do |t|
    t.integer "race_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "leg_threshold_crossed", default: false, null: false
    t.boolean "complete", default: false, null: false
    t.string "name"
  end

end
