# frozen_string_literal: true

require 'rails_helper'

RSpec.describe LegsRoute, type: :model do

  describe 'associations' do
    it { expect(LegsRoute.reflect_on_association(:leg).macro).to eq(:belongs_to) }
    it { expect(LegsRoute.reflect_on_association(:route).macro).to eq(:belongs_to) }
  end

  describe 'auto-increment order' do
    let(:route) { FactoryBot.create(:route) }
    let(:leg1) { FactoryBot.create(:leg) }
    let(:leg2) { FactoryBot.create(:leg) }

    before do
      route.race.locations << leg1.start << leg1.finish << leg2.start << leg2.finish
    end

    it 'assigns order = 1 for the first leg added to a route' do
      route.legs << leg1
      lr = LegsRoute.where(route: route, leg: leg1).first
      expect(lr.order).to eq(1)
    end

    it 'auto-increments order for subsequent legs' do
      route.legs << leg1
      route.legs << leg2
      lr1 = LegsRoute.where(route: route, leg: leg1).first
      lr2 = LegsRoute.where(route: route, leg: leg2).first
      expect(lr1.order).to eq(1)
      expect(lr2.order).to eq(2)
    end
  end

  describe '#to_s' do
    it 'returns expected format' do
      route = FactoryBot.create(:route)
      leg = FactoryBot.create(:leg)
      route.race.locations << leg.start << leg.finish
      route.legs << leg

      lr = LegsRoute.where(route: route, leg: leg).first
      expect(lr.to_s).to eq("Leg: #{leg.id} Route: #{route.id}")
    end
  end
end
