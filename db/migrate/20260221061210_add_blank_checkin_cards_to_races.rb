# frozen_string_literal: true

class AddBlankCheckinCardsToRaces < ActiveRecord::Migration[8.0]
  def change
    add_column :races, :blank_checkin_cards, :integer, default: 0, null: false
  end
end
