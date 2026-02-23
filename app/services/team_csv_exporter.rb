# frozen_string_literal: true

require "csv"

class TeamCsvExporter
  class ExportError < StandardError; end

  def self.call(race)
    new(race).export
  end

  def initialize(race)
    @race = race
  end

  def export
    raise ExportError, "No Dogtag CSV stored for this race" unless @race.dogtag_csv.attached?

    csv_text = @race.dogtag_csv.download
    rows = CSV.parse(csv_text, headers: true)
    headers = rows.headers.compact.map(&:strip)

    number_col = headers.find { |h| h.downcase == "number" }
    raise ExportError, "Stored CSV is missing 'number' column" unless number_col

    # Build lookup: dogtag_id -> team
    teams_by_dogtag = @race.teams.includes(:route).index_by(&:dogtag_id)

    # Insert bib_number and route_name after column 2 (0-indexed)
    insert_at = [2, headers.size].min
    enriched_headers = headers.dup
    enriched_headers.insert(insert_at, "bib_number", "route_name")

    CSV.generate do |csv|
      csv << enriched_headers
      rows.each do |row|
        dogtag_id = row[number_col].to_s.strip.to_i
        team = teams_by_dogtag[dogtag_id]

        fields = row.fields
        new_row = fields[0...insert_at] +
                  [team&.bib_number, team&.route&.name] +
                  fields[insert_at..]
        csv << new_row
      end
    end
  end
end
