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

    # Logo
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

    # Team info (top section)
    if team
      pdf.text "Team Name: #{team.name}", size: 12, style: :bold
      pdf.text "Team ##{team.bib_number}", size: 12, style: :bold
    else
      pdf.text "Team Name: _______________", size: 12, style: :bold
      pdf.text "Team #___", size: 12, style: :bold
    end
    pdf.move_down 8

    # Tilde divider
    pdf.text "~" * 50, size: 10, align: :center, color: "999999"
    pdf.move_down 8

    # Team info (tear-off section)
    if team
      pdf.text "Team Name: #{team.name}", size: 12, style: :bold
      pdf.text "Team ##{team.bib_number}", size: 12, style: :bold
    else
      pdf.text "Team Name: _______________", size: 12, style: :bold
      pdf.text "Team #___", size: 12, style: :bold
    end
    pdf.move_down 12

    # Markdown content
    render_markdown(pdf, @race.checkin_card_content || "")
  end

  def render_markdown(pdf, content)
    content.each_line do |raw_line|
      line = raw_line.chomp

      if line.strip.empty?
        pdf.move_down 10
        next
      end

      # ## Heading → 18pt bold centered
      if line =~ /\A\s*##\s+(.+)/
        heading = Regexp.last_match(1)
        pdf.text heading, size: 18, style: :bold, align: :center
        pdf.move_down 6
        next
      end

      # Lines with ___ blanks → render as stacked panel
      if line.include?("___")
        bold = line.include?("**")
        label = line.gsub(/\*\*/, "").gsub(/_{3,}/, "").strip
        render_panel(pdf, label, bold: bold)
        next
      end

      # Regular text
      rendered = escape_html(line)
      rendered = rendered.gsub(/\*\*(.+?)\*\*/, '<b>\1</b>')
      rendered = rendered.gsub(/\*(.+?)\*/, '<i>\1</i>')
      pdf.text rendered, size: 12, inline_format: true
    end
  end

  def render_panel(pdf, label, bold: false)
    panel_h = 50
    y = pdf.cursor

    # Filled rounded rectangle background
    bg_color = bold ? "E0E0E0" : "F0F0F0"
    pdf.fill_color bg_color
    pdf.fill_rounded_rectangle [0, y], CARD_WIDTH, panel_h, 4
    pdf.fill_color "000000"

    # Thin border
    pdf.line_width = 0.5
    pdf.stroke_rounded_rectangle [0, y], CARD_WIDTH, panel_h, 4

    # Label text inside panel
    label_size = bold ? 16 : 14
    label_style = bold ? :bold : :normal
    pdf.text_box label, at: [10, y - 8], width: CARD_WIDTH - 20,
                 size: label_size, style: label_style

    # Right-aligned fill line
    line_w = 150
    line_x = CARD_WIDTH - line_w - 10
    line_y = y - 38
    pdf.line_width = bold ? 1.5 : 0.75
    pdf.stroke { pdf.line [line_x, line_y], [CARD_WIDTH - 10, line_y] }

    pdf.line_width = 1
    pdf.move_cursor_to y - panel_h - 10
  end

  def escape_html(text)
    text.gsub("&", "&amp;").gsub("<", "&lt;").gsub(">", "&gt;")
  end
end
