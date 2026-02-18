# frozen_string_literal: true

class Distances

  def self.m_to_s(m, unit=nil)
    return '?' unless m.present?

    case unit
    when nil
      "#{m} m"
    when 'mi'
      "#{m_to_mi(m).round(2)} mi"
    when 'km'
      "#{(m/1000).round(2)} km"
    end
  end


  def self.mi_to_m(mi)
    mi_to_km(mi) * 1000
  end

  def self.mi_to_km(mi)
    mi * 1.60934
  end

  def self.km_to_mi(km)
    km * 0.621371
  end

  def self.m_to_mi(m)
    km_to_mi(m / 1000)
  end
end
