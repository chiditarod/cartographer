locations = [
  ['Cobra Lounge', '235 N Ashland Ave', 'Chicago', 'IL', 60607, 'USA', 400, 250],
  ['Output', '1758 W Grand Ave', 'Chicago', 'IL', 60622, 'USA', 200, 150],
  ['Five Star Bar', '1424 W Chicago Ave', 'Chicago', 'IL', 60642, 'USA', 300, 200],
  ['Phyllis Musical Inn', '1800 W Division St', 'Chicago', 'IL', 60622, 'USA', 200, 150],
  ['Roots Pizza', '1924 W Chicago Ave', 'Chicago', 'IL', 60622, 'USA', 400, 250],
  ['Midwest Coast Brewing', '2137 W Walnut St', 'Chicago', 'IL', 60612, 'USA', 500, 400]
]

locations.each do |loc|
  Location.find_or_create_by(name: loc[0]) do |l|
    l.street_address = loc[1]
    l.city = loc[2]
    l.state = loc[3]
    l.zip = loc[4]
    l.country = loc[5]
    l.max_capacity = loc[6]
    l.ideal_capacity = loc[7]
  end
end

cobra = Location.find_by(name: "Cobra Lounge")

Race.find_or_create_by(name: "CHIditarod XX") do |r|
  r.start = cobra
  r.finish = cobra
  r.locations = Location.all
  r.num_stops = 5
  r.max_teams = 150
  r.people_per_team = 5
  r.min_total_distance = 4.2
  r.max_total_distance = 5.7
  r.min_leg_distance = 0.4
  r.max_leg_distance = 1.75
  r.distance_unit = "mi"
end
