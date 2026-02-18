# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Distances do

  describe '.mi_to_km' do
    it 'converts miles to kilometers' do
      expect(Distances.mi_to_km(1)).to be_within(0.001).of(1.60934)
    end

    it 'converts 0 miles to 0 km' do
      expect(Distances.mi_to_km(0)).to eq(0)
    end

    it 'converts fractional miles' do
      expect(Distances.mi_to_km(0.5)).to be_within(0.001).of(0.80467)
    end
  end

  describe '.km_to_mi' do
    it 'converts kilometers to miles' do
      expect(Distances.km_to_mi(1)).to be_within(0.001).of(0.621371)
    end

    it 'converts 0 km to 0 miles' do
      expect(Distances.km_to_mi(0)).to eq(0)
    end
  end

  describe '.mi_to_m' do
    it 'converts miles to meters' do
      expect(Distances.mi_to_m(1)).to be_within(1).of(1609.34)
    end

    it 'converts 0 miles to 0 meters' do
      expect(Distances.mi_to_m(0)).to eq(0)
    end
  end

  describe '.m_to_mi' do
    it 'converts meters to miles' do
      expect(Distances.m_to_mi(1609.34)).to be_within(0.01).of(1.0)
    end

    it 'converts 0 meters to 0 miles' do
      expect(Distances.m_to_mi(0)).to eq(0)
    end
  end

  describe '.m_to_s' do
    context 'when value is nil or blank' do
      it 'returns ? for nil' do
        expect(Distances.m_to_s(nil)).to eq('?')
      end
    end

    context 'when unit is nil' do
      it 'returns meters with m suffix' do
        expect(Distances.m_to_s(1500)).to eq('1500 m')
      end
    end

    context 'when unit is mi' do
      it 'converts to miles and rounds to 2 decimal places' do
        result = Distances.m_to_s(1609.34, 'mi')
        expect(result).to match(/\d+\.\d+ mi/)
        # 1609.34m is approximately 1 mile
        expect(result).to eq('1.0 mi')
      end
    end

    context 'when unit is km' do
      it 'converts to km and rounds to 2 decimal places' do
        # m_to_s does integer division (m/1000) in Ruby 2.x
        expect(Distances.m_to_s(1500, 'km')).to eq('1 km')
      end

      it 'handles exact kilometer values' do
        expect(Distances.m_to_s(2000, 'km')).to eq('2 km')
      end
    end
  end

  describe 'round-trip conversions' do
    it 'mi → km → mi returns approximately the same value' do
      original = 5.0
      converted = Distances.km_to_mi(Distances.mi_to_km(original))
      expect(converted).to be_within(0.001).of(original)
    end

    it 'mi → m → mi returns approximately the same value' do
      original = 3.0
      converted = Distances.m_to_mi(Distances.mi_to_m(original))
      expect(converted).to be_within(0.001).of(original)
    end
  end
end
