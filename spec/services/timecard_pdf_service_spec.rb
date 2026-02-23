# frozen_string_literal: true

require 'rails_helper'

RSpec.describe TimecardPdfService do
  let(:route) { FactoryBot.create(:sequential_route) }
  let(:race) { route.race }

  it 'generates a valid PDF' do
    team = FactoryBot.create(:team, race: race, route: route, dogtag_id: 1)
    pairs = [{ team: team, route: route }]

    pdf_data = TimecardPdfService.call(race, pairs)
    expect(pdf_data).to start_with('%PDF')
  end

  it 'produces correct page count (2 cards per page)' do
    teams = (1..3).map { |i| FactoryBot.create(:team, race: race, route: route, dogtag_id: i) }
    pairs = teams.map { |t| { team: t, route: route } }

    pdf_data = TimecardPdfService.call(race, pairs)
    page_count = pdf_data.scan(%r{/Type\s*/Page[^s]}).size
    expect(page_count).to eq(2) # 3 cards = 2 pages (2 + 1)
  end

  it 'works without a logo' do
    expect(race.logo).not_to be_attached
    team = FactoryBot.create(:team, race: race, route: route, dogtag_id: 1)
    pairs = [{ team: team, route: route }]

    pdf_data = TimecardPdfService.call(race, pairs)
    expect(pdf_data).to start_with('%PDF')
  end

  it 'works with a logo' do
    race.logo.attach(
      io: StringIO.new(File.binread(Rails.root.join('public', 'mock-route-map.png'))),
      filename: 'logo.png',
      content_type: 'image/png'
    )
    team = FactoryBot.create(:team, race: race, route: route, dogtag_id: 1)
    pairs = [{ team: team, route: route }]

    pdf_data = TimecardPdfService.call(race, pairs)
    expect(pdf_data).to start_with('%PDF')
  end

  it 'adds spare blank cards per route' do
    team = FactoryBot.create(:team, race: race, route: route, dogtag_id: 1)
    pairs = [{ team: team, route: route }]

    pdf_data = TimecardPdfService.call(race, pairs, blank_count_per_route: 2)
    expect(pdf_data).to start_with('%PDF')
    page_count = pdf_data.scan(%r{/Type\s*/Page[^s]}).size
    expect(page_count).to eq(2) # 3 cards (1 team + 2 blanks) = 2 pages
  end
end
