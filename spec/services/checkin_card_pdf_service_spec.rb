# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CheckinCardPdfService do
  let(:route) { FactoryBot.create(:sequential_route) }
  let(:race) { route.race }

  it 'generates a valid PDF' do
    team = FactoryBot.create(:team, race: race, route: route, dogtag_id: 1)

    pdf_data = CheckinCardPdfService.call(race, race.teams.where.not(route_id: nil))
    expect(pdf_data).to start_with('%PDF')
  end

  it 'produces correct page count (2 cards per page)' do
    (1..3).each { |i| FactoryBot.create(:team, race: race, route: route, dogtag_id: i) }

    pdf_data = CheckinCardPdfService.call(race, race.teams.where.not(route_id: nil))
    page_count = pdf_data.scan(%r{/Type\s*/Page[^s]}).size
    expect(page_count).to eq(2) # 3 cards = 2 pages (2 + 1)
  end

  it 'works without a logo' do
    expect(race.logo).not_to be_attached
    FactoryBot.create(:team, race: race, route: route, dogtag_id: 1)

    pdf_data = CheckinCardPdfService.call(race, race.teams.where.not(route_id: nil))
    expect(pdf_data).to start_with('%PDF')
  end

  it 'adds spare blank cards' do
    FactoryBot.create(:team, race: race, route: route, dogtag_id: 1)

    pdf_data = CheckinCardPdfService.call(race, race.teams.where.not(route_id: nil), blank_count: 2)
    expect(pdf_data).to start_with('%PDF')
    page_count = pdf_data.scan(%r{/Type\s*/Page[^s]}).size
    expect(page_count).to eq(2) # 3 cards (1 team + 2 blanks) = 2 pages
  end

  it 'renders collection grid' do
    FactoryBot.create(:team, race: race, route: route, dogtag_id: 1)

    pdf_data = CheckinCardPdfService.call(race, race.teams.where.not(route_id: nil))
    expect(pdf_data).to start_with('%PDF')
  end
end
