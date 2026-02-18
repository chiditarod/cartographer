# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2026_02_18_193410) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "job_statuses", force: :cascade do |t|
    t.string "job_type", null: false
    t.string "status", default: "pending", null: false
    t.integer "progress", default: 0
    t.integer "total", default: 0
    t.string "message"
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_job_statuses_on_created_at"
    t.index ["status"], name: "index_job_statuses_on_status"
  end

  create_table "legs", force: :cascade do |t|
    t.float "distance", null: false
    t.integer "start_id", null: false
    t.integer "finish_id", null: false
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.index ["start_id", "finish_id"], name: "index_legs_on_start_id_and_finish_id", unique: true
  end

  create_table "legs_routes", force: :cascade do |t|
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
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
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
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.index ["name"], name: "index_races_on_name", unique: true
  end

  create_table "routes", force: :cascade do |t|
    t.integer "race_id", null: false
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.boolean "leg_threshold_crossed", default: false, null: false
    t.boolean "complete", default: false, null: false
    t.string "name"
    t.decimal "rarity_score", precision: 5, scale: 1
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
end
