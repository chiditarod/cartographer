# frozen_string_literal: true

require 'rails_helper'

RSpec.describe RoutePdfService do
  let(:route) { FactoryBot.create(:sequential_route) }

  it 'generates a valid PDF' do
    pdf_data = RoutePdfService.call(route)
    expect(pdf_data).to start_with('%PDF')
  end

  it 'works without a logo' do
    expect(route.race.logo).not_to be_attached
    pdf_data = RoutePdfService.call(route)
    expect(pdf_data).to start_with('%PDF')
  end

  it 'works with a logo' do
    route.race.logo.attach(
      io: StringIO.new(File.binread(Rails.root.join('public', 'mock-route-map.png'))),
      filename: 'logo.png',
      content_type: 'image/png'
    )
    pdf_data = RoutePdfService.call(route)
    expect(pdf_data).to start_with('%PDF')
  end

  it 'works in MOCK_MAP mode' do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with('MOCK_MAP').and_return('true')

    pdf_data = RoutePdfService.call(route)
    expect(pdf_data).to start_with('%PDF')
  end

  it 'works without a map_url' do
    allow(route).to receive(:to_google_map).and_return(nil)
    pdf_data = RoutePdfService.call(route)
    expect(pdf_data).to start_with('%PDF')
  end
end
