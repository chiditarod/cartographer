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
        pdf.move_down 8
        next
      end

      # ## Heading
      if line =~ /\A\s*##\s+(.+)/
        heading = Regexp.last_match(1)
        pdf.text "<u><b>#{escape_html(heading)}</b></u>", size: 14, inline_format: true
        pdf.move_down 4
        next
      end

      # Convert markdown bold/italic to Prawn inline format
      rendered = escape_html(line)
      rendered = rendered.gsub(/\*\*(.+?)\*\*/, '<b>\1</b>')
      rendered = rendered.gsub(/\*(.+?)\*/, '<i>\1</i>')

      # Handle lines with ___ blanks — draw text with inline underline segments
      if rendered.include?("___")
        render_line_with_blanks(pdf, rendered)
      else
        pdf.text rendered, size: 10, inline_format: true
      end
    end
  end

  def render_line_with_blanks(pdf, line)
    # Split on runs of 3+ underscores
    parts = line.split(/(_{3,})/)
    y = pdf.cursor
    x = 0

    parts.each do |part|
      if part =~ /\A_{3,}\z/
        # Draw a horizontal line for the blank
        line_width = [part.length * 5, 120].min
        pdf.stroke do
          pdf.line [x, y - 10], [x + line_width, y - 10]
        end
        x += line_width + 4
      else
        next if part.empty?
        w = pdf.width_of(part, size: 10, inline_format: true)
        pdf.draw_text part, at: [x, y - 10], size: 10, inline_format: true
        x += w
      end
    end

    pdf.move_down 16
  end

  def escape_html(text)
    text.gsub("&", "&amp;").gsub("<", "&lt;").gsub(">", "&gt;")
  end
end
