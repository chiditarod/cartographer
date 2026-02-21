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
      teams = by_route[route].sort_by { |p| p[:team].bib_number }
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
        pdf.image logo_io, height: 80, position: :center
        pdf.move_down 6
      rescue StandardError
        # skip logo if it can't be loaded
      end
    end

    pdf.text @race.name, size: 30, style: :bold, align: :center
    pdf.move_down 8

    # Team info
    if team
      pdf.text team.name, size: 20, style: :bold
      pdf.text "Team ##{team.bib_number}", size: 16, style: :bold
    else
      pdf.text "Team #", size: 16, style: :bold
    end
    route_label = route.name || "Route ##{route.id}"
    pdf.text route_label, size: 14, color: "666666"
    pdf.move_down 8

    # Checkpoint rows — dynamically sized to fill available space
    # Skip start location (index 0) — timecards begin at CP 1
    display_sequence = location_sequence.drop(1)
    return if display_sequence.empty?

    available = pdf.cursor - MARGIN
    num_rows = display_sequence.size
    row_height = available / num_rows.to_f

    # Scale box height proportionally, capped for readability
    box_height = [[row_height * 0.40, 30].max, 40].min
    label_col_width = 40
    time_label_width = 70

    num_rows.times do |i|
      loc = display_sequence[i]
      is_finish = i == display_sequence.size - 1
      label = is_finish ? "FIN" : "#{i + 1}"

      y_pos = pdf.cursor

      # Checkpoint number (large) + location name
      pdf.text_box label, at: [0, y_pos], width: label_col_width, size: 24, style: :bold
      pdf.text_box loc[:name], at: [label_col_width, y_pos], width: CARD_WIDTH - label_col_width,
                   size: 14, color: "333333"

      pdf.move_down 22

      # TIME IN / TIME OUT boxes (finish only gets TIME IN)
      half_width = (CARD_WIDTH - 8) / 2.0
      in_box_width = half_width - time_label_width
      y_box = pdf.cursor

      pdf.text_box "TiME iN:", at: [0, y_box], width: time_label_width, size: 12, style: :bold
      pdf.stroke_rectangle [time_label_width, y_box], in_box_width, box_height

      unless is_finish
        out_x = half_width + 8
        pdf.text_box "TiME OUT:", at: [out_x, y_box], width: time_label_width, size: 12, style: :bold
        pdf.stroke_rectangle [out_x + time_label_width, y_box], in_box_width, box_height
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
