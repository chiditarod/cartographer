# frozen_string_literal: true

class RouteBalancer
  # Selects `count` routes from the race's complete routes that provide
  # the most balanced distribution of locations across checkpoint positions.
  #
  # Uses a greedy iterative algorithm:
  # 1. Start with empty selection and zero-frequency matrix
  # 2. For each slot, pick the route that minimizes total imbalance
  # 3. Imbalance = sum across positions of (max_freq - min_freq)
  #
  # Returns an array of route IDs.
  def self.call(race, count)
    return [] if count <= 0

    routes = race.routes.complete.includes(legs: [:start, :finish])
    return [] if routes.empty?

    num_stops = race.num_stops

    # Build location sequences for each route (intermediate CPs only)
    route_data = routes.map do |r|
      locations = r.legs.map { |l| l.start.id } + [r.legs.last.finish.id]
      { id: r.id, sequence: locations[1..num_stops] }
    end

    # Collect all unique location IDs at each position
    all_locations_at = Array.new(num_stops) { Set.new }
    route_data.each do |rd|
      rd[:sequence].each_with_index do |loc_id, pos|
        all_locations_at[pos].add(loc_id)
      end
    end

    # Greedy selection
    selected_ids = []
    selected_indices = Set.new
    freq = Array.new(num_stops) { Hash.new(0) }

    count.times do
      best_index = nil
      best_score = Float::INFINITY

      route_data.each_with_index do |rd, idx|
        next if selected_indices.include?(idx)

        # Simulate adding this route
        score = 0
        rd[:sequence].each_with_index do |loc_id, pos|
          simulated = freq[pos].dup
          simulated[loc_id] += 1
          values = simulated.values
          score += values.max - values.min
        end

        if score < best_score
          best_score = score
          best_index = idx
        end
      end

      break unless best_index

      # Commit selection
      selected_indices.add(best_index)
      selected_ids << route_data[best_index][:id]
      route_data[best_index][:sequence].each_with_index do |loc_id, pos|
        freq[pos][loc_id] += 1
      end
    end

    selected_ids
  end
end
