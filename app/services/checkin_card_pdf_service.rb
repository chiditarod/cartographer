# frozen_string_literal: true

class CheckinCardPdfService
  # LETTER landscape: 792 x 612 pt
  PAGE_WIDTH     = 792
  PAGE_HEIGHT    = 612
  MARGIN         = 36
  GUTTER         = 36
  CARD_INSET     = 12
  CARD_WIDTH     = (PAGE_WIDTH - (MARGIN * 2) - GUTTER) / 2.0 - CARD_INSET
  CARD_HEIGHT    = PAGE_HEIGHT - (MARGIN * 2)

  def self.call(race, teams, blank_count: 0)
    new(race, teams, blank_count).generate
  end

  def initialize(race, teams, blank_count)
    @race = race
    @teams = teams
    @blank_count = blank_count
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
    cards = @teams.order(:bib_number).map { |t| { team: t, blank: false } }

    @blank_count.times do
      cards << { team: nil, blank: true }
    end

    cards
  end

  def render_card(pdf, card)
    team = card[:team]

    # Race name
    pdf.text @race.name, size: 22, style: :bold, align: :center
    pdf.move_down 4

    # Subtitle
    pdf.text "Checkin Card", size: 14, align: :center
    pdf.move_down 4

    # Instruction
    pdf.text "This will help you navigate getting registered today.",
             size: 9, align: :center, color: "666666"
    pdf.move_down 12

    # Team info
    render_team_info(pdf, team)
    pdf.move_down 16

    # Collection grid (Toiletries, Food, Money × Pre-Event, Day-Of, Total)
    render_collection_grid(pdf)
  end

  def render_team_info(pdf, team)
    if team
      pdf.text "Team Name: #{team.name}", size: 12, style: :bold
      pdf.text "Team ##{team.bib_number}", size: 12, style: :bold
    else
      # Longer fill lines for blank cards
      y = pdf.cursor
      label = "Team Name: "
      label_w = pdf.width_of(label, size: 12, style: :bold)
      pdf.draw_text label, at: [0, y - 12], size: 12, style: :bold
      line_end = CARD_WIDTH - 10
      pdf.line_width = 0.75
      pdf.stroke { pdf.line [label_w, y - 14], [line_end, y - 14] }
      pdf.move_down 18

      y = pdf.cursor
      label = "Team #"
      label_w = pdf.width_of(label, size: 12, style: :bold)
      pdf.draw_text label, at: [0, y - 12], size: 12, style: :bold
      pdf.stroke { pdf.line [label_w, y - 14], [label_w + 80, y - 14] }
      pdf.line_width = 1
      pdf.move_down 16
    end
  end

  def render_collection_grid(pdf)
    col_labels = %w[Toiletries Food Money]
    row_labels = ["Pre-Event", "Day-Of", "Total"]

    label_w = 72
    gap = 8
    header_h = 18
    divider_space = 14

    data_col_w = (CARD_WIDTH - label_w - gap * 4) / 3.0

    # Calculate cell height to fill available space
    available = pdf.cursor - header_h - gap * 3 - divider_space
    cell_h = [available / 3.0, 110].min

    y = pdf.cursor

    # Column headers
    col_labels.each_with_index do |label, i|
      x = label_w + gap + i * (data_col_w + gap)
      pdf.text_box label, at: [x, y], width: data_col_w, height: header_h,
                   size: 11, style: :bold, align: :center, valign: :bottom
    end
    y -= header_h + gap

    # Pre-Event row
    render_grid_row(pdf, row_labels[0], y, label_w, data_col_w, cell_h, gap)
    y -= cell_h + gap

    # Day-Of row
    render_grid_row(pdf, row_labels[1], y, label_w, data_col_w, cell_h, gap)
    y -= cell_h + 6

    # Horizontal divider
    pdf.stroke_color "BBBBBB"
    pdf.line_width = 1.0
    pdf.stroke { pdf.line [label_w, y], [CARD_WIDTH, y] }
    pdf.stroke_color "000000"
    y -= 6

    # Total row
    render_grid_row(pdf, row_labels[2], y, label_w, data_col_w, cell_h, gap)

    pdf.line_width = 1
  end

  def render_grid_row(pdf, label, y, label_w, col_w, cell_h, gap)
    pdf.text_box label, at: [0, y], width: label_w, height: cell_h,
                 size: 11, style: :bold, valign: :center

    3.times do |i|
      x = label_w + gap + i * (col_w + gap)

      pdf.fill_color "F0F0F0"
      pdf.fill_rounded_rectangle [x, y], col_w, cell_h, 4
      pdf.fill_color "000000"

      pdf.line_width = 0.5
      pdf.stroke_rounded_rectangle [x, y], col_w, cell_h, 4
    end
  end
end
