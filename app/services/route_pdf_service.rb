# frozen_string_literal: true

require "open-uri"

class RoutePdfService
  PAGE_WIDTH     = 612  # 8.5 inches at 72 dpi
  PAGE_HEIGHT    = 792  # 11 inches at 72 dpi
  MARGIN         = 36   # 0.5 inches
  CONTENT_WIDTH  = PAGE_WIDTH - (MARGIN * 2)
  CONTENT_HEIGHT = PAGE_HEIGHT - (MARGIN * 2)

  HEADER_GAP = 10
  MAP_GAP    = 10

  def self.call(route)
    new(route).generate
  end

  def initialize(route)
    @route = route
    @race  = route.race
  end

  def generate
    pdf = Prawn::Document.new(
      page_size: "LETTER",
      margin: MARGIN
    )

    draw_header(pdf)
    remaining = pdf.cursor - MARGIN  # space left for map + table
    table_height = estimate_table_height
    max_map_height = remaining - table_height - MAP_GAP
    draw_map(pdf, max_map_height)
    draw_location_table(pdf)

    pdf.render
  end

  private

  def draw_header(pdf)
    logo_height = 50
    logo_width = 0
    route_title = @route.name || "Route ##{@route.id}"

    if @race.logo.attached?
      begin
        logo_data = @race.logo.download
        logo_io = StringIO.new(logo_data)
        info = pdf.image logo_io, height: logo_height, position: :left
        logo_width = info.scaled_width
        # Move cursor back up to draw text beside the logo
        pdf.move_up logo_height
      rescue StandardError
        logo_width = 0
      end
    end

    if logo_width > 0
      text_left = logo_width + 10
      pdf.bounding_box([text_left, pdf.cursor], width: CONTENT_WIDTH - text_left, height: logo_height) do
        pdf.text route_title, size: 18, style: :bold
        pdf.text @race.name, size: 14, color: "666666"
      end
    else
      pdf.text route_title, size: 18, style: :bold
      pdf.text @race.name, size: 14, color: "666666"
    end

    pdf.move_down HEADER_GAP
  end

  def draw_map(pdf, max_height)
    map_url = @route.to_google_map
    return unless map_url.present?
    return if max_height < 40  # not enough space for a meaningful map

    begin
      image_data = fetch_map_image(map_url)
      return unless image_data

      pdf.image StringIO.new(image_data),
                fit: [CONTENT_WIDTH, max_height],
                position: :center
    rescue StandardError
      # silently skip map if it can't be loaded
    end

    pdf.move_down MAP_GAP
  end

  def draw_location_table(pdf)
    return unless @route.legs.any?

    rows = build_table_rows

    pdf.table(rows, width: CONTENT_WIDTH, cell_style: { size: 9, padding: [4, 6] }) do |t|
      t.row(0).font_style = :bold
      t.row(0).background_color = "EEEEEE"
      t.columns(0).width = 50
    end
  end

  def build_table_rows
    legs = @route.legs.includes(:start, :finish).to_a
    rows = [["Type", "Name", "Address"]]

    legs.each_with_index do |leg, index|
      if index == 0
        rows << ["Start", leg.start.name, leg.start.street_address || ""]
      end

      type = if index == legs.size - 1
               "Finish"
             else
               "#{index + 1}"
             end

      rows << [type, leg.finish.name, leg.finish.street_address || ""]
    end

    rows
  end

  def estimate_table_height
    return 0 unless @route.legs.any?
    row_count = @route.legs.size + 2  # header + start + each finish
    row_height = 9 + 8  # font size + padding (4 top + 4 bottom)
    row_count * row_height
  end

  def fetch_map_image(map_url)
    if map_url.start_with?("/")
      local_path = Rails.root.join("public", map_url.sub(%r{\A/}, ""))
      return nil unless File.exist?(local_path)
      File.binread(local_path)
    else
      URI.open(map_url).read
    end
  end
end
