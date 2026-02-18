# frozen_string_literal: true

require 'rails_helper'

RSpec.describe RoutePdfService do
  let(:route) { FactoryBot.create(:sequential_route) }

  it 'generates a valid single-page PDF' do
    pdf_data = RoutePdfService.call(route)
    expect(pdf_data).to start_with('%PDF')
    # Prawn PDFs contain /Type /Page entries — one per page (excluding /Type /Pages)
    page_count = pdf_data.scan(%r{/Type\s*/Page[^s]}).size
    expect(page_count).to eq(1)
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

  describe '.call_batch' do
    it 'produces a multi-page PDF for multiple routes' do
      route2 = FactoryBot.create(:sequential_route, race: route.race)
      pdf_data = RoutePdfService.call_batch([route, route2])
      expect(pdf_data).to start_with('%PDF')
      page_count = pdf_data.scan(%r{/Type\s*/Page[^s]}).size
      expect(page_count).to eq(2)
    end

    it 'produces a single-page PDF for one route' do
      pdf_data = RoutePdfService.call_batch([route])
      expect(pdf_data).to start_with('%PDF')
      page_count = pdf_data.scan(%r{/Type\s*/Page[^s]}).size
      expect(page_count).to eq(1)
    end
  end
end
