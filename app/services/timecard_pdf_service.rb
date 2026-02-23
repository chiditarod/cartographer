# frozen_string_literal: true

class TimecardPdfService
  # LETTER landscape: 792 x 612 pt
  PAGE_WIDTH     = 792
  PAGE_HEIGHT    = 612
  MARGIN         = 36
  GUTTER         = 36
  CARD_INSET     = 12
  CARD_WIDTH     = (PAGE_WIDTH - (MARGIN * 2) - GUTTER) / 2.0 - CARD_INSET
  CARD_HEIGHT    = PAGE_HEIGHT - (MARGIN * 2)

  def self.call(race, team_route_pairs, blank_count_per_route: 0)
    new(race, team_route_pairs, blank_count_per_route).generate
  end

  def initialize(race, team_route_pairs, blank_count_per_route)
    @race = race
    @team_route_pairs = team_route_pairs
    @blank_count_per_route = blank_count_per_route
  end

  def generate
    cards = build_card_data

    pdf = Prawn::Document.new(
      page_size: [PAGE_WIDTH, PAGE_HEIGHT],
      margin: MARGIN
    )

    cards.each_slice(2).with_index do |pair, page_index|
      pdf.start_new_page if page_index > 0

      pair.each_with_index do |card, slot|
        x_offset = slot == 0 ? CARD_INSET : CARD_WIDTH + CARD_INSET + GUTTER
        pdf.bounding_box([x_offset, pdf.bounds.top], width: CARD_WIDTH, height: CARD_HEIGHT) do
          render_card(pdf, card)
        end
      end
    end

    pdf.render
  end

  private

  def build_card_data
    cards = []

    # Group assigned teams by route, sorted by route name then bib number
    by_route = @team_route_pairs.group_by { |p| p[:route] }
    sorted_routes = by_route.keys.sort_by { |r| r.name || "Route ##{r.id}" }

    sorted_routes.each do |route|
      teams = by_route[route].sort_by { |p| p[:team].dogtag_id }
      teams.each do |pair|
        cards << { team: pair[:team], route: route, blank: false }
      end

      # Add spare blanks for this route
      @blank_count_per_route.times do
        cards << { team: nil, route: route, blank: true }
      end
    end

    cards
  end

  def render_card(pdf, card)
    route = card[:route]
    team = card[:team]
    location_sequence = build_location_sequence(route)

    # Header — logo and race name at top (matching checkin card style)
    if @race.logo.attached?
      begin
        logo_data = @race.logo.download
        logo_io = StringIO.new(logo_data)
        pdf.image logo_io, height: 60, position: :center
        pdf.move_down 4
      rescue StandardError
        # skip logo if it can't be loaded
      end
    end

    pdf.text @race.name, size: 28, style: :bold, align: :center
    pdf.move_down 4

    # Team info
    if team
      pdf.text team.name, size: 18, style: :bold
      pdf.text "Team ##{team.display_number}", size: 14, style: :bold
    else
      # Blank team name fill line
      y = pdf.cursor
      label = "Team Name: "
      label_w = pdf.width_of(label, size: 18, style: :bold)
      pdf.draw_text label, at: [0, y - 18], size: 18, style: :bold
      pdf.line_width = 0.75
      pdf.stroke { pdf.line [label_w, y - 20], [CARD_WIDTH - 10, y - 20] }
      pdf.move_down 24
      pdf.text "Team #", size: 14, style: :bold
    end
    route_label = route.name || "Route ##{route.id}"
    pdf.text route_label, size: 12, color: "666666"
    pdf.move_down 6

    # Checkpoint rows — dynamically sized to fill available space
    # Skip start location (index 0) — timecards begin at CP 1
    display_sequence = location_sequence.drop(1)
    return if display_sequence.empty?

    available = pdf.cursor - MARGIN
    num_rows = display_sequence.size
    row_height = available / num_rows.to_f

    # Layout: big number in left column spanning full row, name + boxes to the right
    num_col = 48
    right_x = num_col + 2
    right_width = CARD_WIDTH - right_x
    time_label_width = 65

    # Scale box height to fill row (name ~18pt + gap + box + bottom padding = row_height)
    box_height = [[row_height - 26, 24].max, 36].min

    num_rows.times do |i|
      loc = display_sequence[i]
      is_finish = i == display_sequence.size - 1
      label = is_finish ? "FIN" : "#{i + 1}"

      y_pos = pdf.cursor

      # Big number in left column, vertically centered across the full row
      pdf.text_box label, at: [0, y_pos], width: num_col, height: row_height,
                   size: 24, style: :bold, valign: :center

      # Location name — top of right column
      pdf.text_box loc[:name], at: [right_x, y_pos - 2], width: right_width,
                   size: 14, style: :bold, color: "333333"

      # TIME IN / TIME OUT boxes below location name
      box_y = y_pos - 20
      half = (right_width - 8) / 2.0
      in_box_width = half - time_label_width

      pdf.text_box "TiME iN:", at: [right_x, box_y], width: time_label_width, height: box_height,
                   size: 11, style: :bold, valign: :center
      pdf.stroke_rectangle [right_x + time_label_width, box_y], in_box_width, box_height

      unless is_finish
        out_x = right_x + half + 8
        pdf.text_box "TiME OUT:", at: [out_x, box_y], width: time_label_width, height: box_height,
                     size: 11, style: :bold, valign: :center
        pdf.stroke_rectangle [out_x + time_label_width, box_y], in_box_width, box_height
      end

      # Advance to next row boundary
      pdf.move_cursor_to y_pos - row_height
    end
  end

  def build_location_sequence(route)
    legs = route.legs.includes(:start, :finish).to_a
    return [] if legs.empty?

    sequence = legs.map { |l| { id: l.start.id, name: l.start.name } }
    sequence << { id: legs.last.finish.id, name: legs.last.finish.name }
    sequence
  end
end
