# frozen_string_literal: true

require "open-uri"

class RoutePdfService
  PAGE_WIDTH  = 612  # 8.5 inches at 72 dpi
  PAGE_HEIGHT = 792  # 11 inches at 72 dpi
  MARGIN      = 36   # 0.5 inches

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
    draw_map(pdf)
    draw_location_table(pdf)
    draw_footer(pdf)

    pdf.render
  end

  private

  def draw_header(pdf)
    logo_height = 50

    if @race.logo.attached?
      begin
        logo_data = @race.logo.download
        logo_io = StringIO.new(logo_data)
        pdf.image logo_io, height: logo_height, position: :left
      rescue StandardError
        # skip logo if it can't be loaded
      end
    end

    y_after_logo = @race.logo.attached? ? pdf.cursor : pdf.cursor
    pdf.move_down 4 unless !@race.logo.attached?

    pdf.text @route.name || "Route ##{@route.id}", size: 18, style: :bold
    pdf.text @race.name, size: 14, color: "666666"
    pdf.move_down 12
  end

  def draw_map(pdf)
    map_url = @route.to_google_map
    return unless map_url.present?

    begin
      image_data = fetch_map_image(map_url)
      return unless image_data

      content_width = PAGE_WIDTH - (MARGIN * 2)
      max_map_height = (PAGE_HEIGHT - (MARGIN * 2)) * 0.45

      pdf.image StringIO.new(image_data),
                width: content_width,
                fit: [content_width, max_map_height],
                position: :center
    rescue StandardError
      pdf.text "[Map unavailable]", size: 10, color: "999999", align: :center
    end

    pdf.move_down 12
  end

  def draw_location_table(pdf)
    return unless @route.legs.any?

    legs = @route.legs.includes(:start, :finish).to_a

    rows = [["#", "Type", "Name", "Address"]]

    legs.each_with_index do |leg, index|
      if index == 0
        rows << ["1", "Start", leg.start.name, leg.start.street_address || ""]
      end

      type = if index == legs.size - 1
               "Finish"
             else
               "CP #{index + 1}"
             end

      rows << ["#{index + 2}", type, leg.finish.name, leg.finish.street_address || ""]
    end

    content_width = PAGE_WIDTH - (MARGIN * 2)

    pdf.table(rows, width: content_width, cell_style: { size: 9, padding: [4, 6] }) do |t|
      t.row(0).font_style = :bold
      t.row(0).background_color = "EEEEEE"
      t.columns(0).width = 30
      t.columns(1).width = 50
    end

    pdf.move_down 12
  end

  def draw_footer(pdf)
    parts = []

    if @route.distance.present?
      parts << "Total Distance: #{@route.distance} #{@race.distance_unit}"
    end

    if @route.rarity_score.present?
      parts << "Rarity Score: #{@route.rarity_score}"
    end

    return if parts.empty?

    pdf.text parts.join("  |  "), size: 10, color: "444444"
  end

  def fetch_map_image(map_url)
    if map_url.start_with?("/")
      # MOCK_MAP or local file
      local_path = Rails.root.join("public", map_url.sub(%r{\A/}, ""))
      return nil unless File.exist?(local_path)
      File.binread(local_path)
    else
      URI.open(map_url).read
    end
  end
end
