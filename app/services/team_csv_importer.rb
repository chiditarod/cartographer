# frozen_string_literal: true

require "csv"

class TeamCsvImporter
  class ImportError < StandardError; end

  def self.call(race, csv_text)
    new(race, csv_text).import
  end

  def initialize(race, csv_text)
    @race = race
    @csv_text = csv_text
  end

  def import
    rows = CSV.parse(@csv_text, headers: true)
    headers = rows.headers.compact.map(&:strip)

    number_col = headers.find { |h| h.downcase == "number" }
    name_col   = headers.find { |h| h.downcase == "name" }

    unless number_col && name_col
      raise ImportError,
        "CSV must have 'number' and 'name' columns. Found: #{headers.join(', ')}"
    end

    imported = 0
    skipped  = 0

    rows.each do |row|
      bib  = row[number_col].to_s.strip.to_i
      name = row[name_col].to_s.strip

      if bib <= 0 || name.blank?
        skipped += 1
        next
      end

      team = @race.teams.find_or_initialize_by(dogtag_id: bib)
      team.name = name
      team.save!
      imported += 1
    end

    { imported: imported, skipped: skipped, total: rows.size }
  end
end
