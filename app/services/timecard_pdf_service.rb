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
      pdf.text team.name, size: 18, style: :bold
      pdf.text "Team ##{team.bib_number}", size: 14, style: :bold
    else
      pdf.text "Team #", size: 14, style: :bold
    end
    route_label = route.name || "Route ##{route.id}"
    pdf.text route_label, size: 12, color: "666666"
    pdf.move_down 8

    # Checkpoint rows
    num_stops = @race.num_stops
    box_width = (CARD_WIDTH - 60) / 2.0  # space for label + two boxes
    box_height = 20
    row_height = box_height + 18  # box + spacing

    # Calculate available space for checkpoints
    available = pdf.cursor - MARGIN
    max_rows = (available / row_height).floor
    # Skip start location (index 0) — timecards begin at CP 1
    display_sequence = location_sequence.drop(1)
    rows_to_render = [display_sequence.size, max_rows].min

    rows_to_render.times do |i|
      loc = display_sequence[i]
      is_finish = i == display_sequence.size - 1
      label = is_finish ? "FINISH" : "#{i + 1}"

      y_pos = pdf.cursor

      # Checkpoint number + name
      pdf.text_box label, at: [0, y_pos], width: 50, size: 10, style: :bold
      pdf.text_box loc[:name], at: [50, y_pos], width: CARD_WIDTH - 60, size: 11, color: "333333"

      pdf.move_down 12

      # TIME IN / TIME OUT boxes (finish only gets TIME IN)
      time_label_width = 55
      in_box_x = time_label_width
      out_label_x = in_box_x + box_width + 6
      out_box_x = out_label_x + time_label_width

      y_box = pdf.cursor
      pdf.text_box "TiME iN:", at: [0, y_box], width: time_label_width, size: 10, style: :bold
      pdf.stroke_rectangle [in_box_x, y_box], box_width - time_label_width - 4, box_height

      unless is_finish
        if out_box_x + box_width - time_label_width - 4 <= CARD_WIDTH
          pdf.text_box "TiME OUT:", at: [out_label_x, y_box], width: time_label_width, size: 10, style: :bold
          pdf.stroke_rectangle [out_box_x, y_box], box_width - time_label_width - 4, box_height
        end
      end

      pdf.move_down box_height + 6
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
