# frozen_string_literal: true

class AddCheckinCardContentToRaces < ActiveRecord::Migration[8.0]
  def change
    add_column :races, :checkin_card_content, :text, default: <<~MD
      ## Food Drive Information

      Food poundage pre-dropped _______________

      Food Poundage on Race Day + _______________

      Total Food Poundage = _______________
    MD
  end
end
