# frozen_string_literal: true

class UpdateCheckinCardContentDefault < ActiveRecord::Migration[8.0]
  OLD_DEFAULT = <<~MD
    ## Food Drive Information

    Food poundage pre-dropped _______________

    Food Poundage on Race Day + _______________

    Total Food Poundage = _______________
  MD

  NEW_DEFAULT = <<~MD
    ## Food Drive Information

    Food poundage pre-dropped _______________

    Food Poundage on Race Day + _______________

    Toiletries Poundage on Race Day + _______________

    **Total Poundage = _______________**
  MD

  def up
    change_column_default :races, :checkin_card_content, NEW_DEFAULT
    Race.where(checkin_card_content: OLD_DEFAULT).update_all(checkin_card_content: NEW_DEFAULT)
  end

  def down
    change_column_default :races, :checkin_card_content, OLD_DEFAULT
    Race.where(checkin_card_content: NEW_DEFAULT).update_all(checkin_card_content: OLD_DEFAULT)
  end
end
