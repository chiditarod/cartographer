# Cartographer

Ruby on Rails app that finds viable routes for the CHIditarod, based on
customizable criteria like leg length, overall race length, etc.

[![CI Build Status](https://dl.circleci.com/status-badge/img/gh/chiditarod/cartographer/tree/master.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/gh/chiditarod/cartographer/tree/master) [![Maintainability](https://api.codeclimate.com/v1/badges/0f8b7b85f89b0024665a/maintainability)](https://codeclimate.com/github/chiditarod/cartographer/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/0f8b7b85f89b0024665a/test_coverage)](https://codeclimate.com/github/chiditarod/cartographer/test_coverage)

## Google API Setup

Your Google Cloud Platform account and associated [API key](https://console.cloud.google.com/apis/credentials) must have access to the following APIs:

- [Distance Matrix API](https://developers.google.com/maps/documentation/distance-matrix/intro)
- [Geocoding API](https://developers.google.com/maps/documentation/geocoding/start)
- [Static Maps API](https://developers.google.com/maps/documentation/maps-static/intro)

## Runtime Environment

| Variable Name | Purpose |
| ---- | ------- |
| `GOOGLE_API_KEY` | Google Cloud Platform API key with access to the APIs listed above. |
| `MOCK_MAP` | When `true` load a fake route map instead of querying the Google Static API. |


## Example Usage

### Seed

```bash
bundle exec rake db:seed
DISABLE_SPRING=true GOOGLE_API_KEY=... bundle exec rails c
```

### Generate all Legs using Google Maps API

```ruby
BulkLegCreator.perform_now(Location.pluck(:id))
```

### Generate Routes

Ensure the first column, the ID, remains present when handing off the routes. We need the ID to know
which routes to name.

```ruby
RouteGenerator.call(Race.first)
winners = Route.complete
puts winners.map(&:to_csv)
puts winners.map(&:to_s)

selected = winners.select{|r| r.name != nil}
selected.map(&:to_csv)
```

### Geocode Locations using Google Maps API

```ruby
GeocodeLocationJob.perform_now(Location.pluck(:id))
```

### Create Route Maps

After you have selected the routes you want to use, you need to name them, then you can generate and print route maps using the Google Maps API.

For example, if we have a set of route IDs and labels we want to name them, set the names as follows.

```ruby
names = [
  [771,"A"],[778,"H"],[806,"J"],[809,"K"],[816,"L"],[890,"G"],
  [931,"I"],[991,"D"],[1013,"B"],[1051,"C"],[1058,"E"],[1134,"F"]
]

names.each do |n|
  r = Route.find(n[0])
  r.name = n[1]
  r.save
  r.reload
  puts "Route ID #{r.id} now has name #{r.name}"
end
```

After the Route names have been updated, you can generate the maps. Get a list of urls for the IDs you want.

```ruby
names = [
  [771,"A"],[778,"H"],[806,"J"],[809,"K"],[816,"L"],[890,"G"],
  [931,"I"],[991,"D"],[1013,"B"],[1051,"C"],[1058,"E"],[1134,"F"]
]

to_print = winners.select do |w|
  if names.map{|n|n.first}.include?(w.id)
    true
  else
    false
  end
end

to_print.each do |w|
  puts "/races/#{w.race_id}/routes/#{w.id}"
end
```

```
/races/3/routes/771
/races/3/routes/778
...
```

Boot the rails server
```sh
DISABLE_SPRING=true GOOGLE_API_KEY=... bundle exec rails s
```

Generate a route map using one of the Routes you care about.

```
http://localhost:3000/races/3/routes/771
```

Save to PDF, and repeat for the remaining maps.

### Clean things up

```ruby
Race.destroy_all; Route.destroy_all; Leg.destroy_all; Location.destroy_all; Leg.destroy_all; nil
```


## Developer Setup

*Tested using MacOS Sequoia 15.1.1*.

Prerequisites

- [Xcode](https://itunes.apple.com/us/app/xcode/id497799835),
  [Docker](https://www.docker.com), [Homebrew](https://brew.sh/)

Install rbenv & Ruby

```bash
brew install rbenv
rbenv install $(cat .ruby-version)
gem install bundler
```

Install Gems

```bash
brew install libffi libpq

bundle config --local build.ffi --with-ldflags="-L/opt/homebrew/opt/libffi/lib"
export PKG_CONFIG_PATH="$PKG_CONFIG_PATH:/opt/homebrew/opt/libffi/lib/pkgconfig"

bundle config --local build.pg --with-opt-dir="/opt/homebrew/opt/libpq"
export PKG_CONFIG_PATH="$PKG_CONFIG_PATH:/opt/homebrew/opt/libpq/lib/pkgconfig"

bundle install

bundle exec rails db:migrate
```

