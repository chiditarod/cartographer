# Cartographer

Ruby on Rails app that finds viable routes for the CHIditarod, based on
customizable criteria like leg length, overall race length, etc.

[![Build Status](https://travis-ci.com/chiditarod/cartographer.svg?branch=master)](https://travis-ci.com/chiditarod/cartographer) [![Maintainability](https://api.codeclimate.com/v1/badges/0f8b7b85f89b0024665a/maintainability)](https://codeclimate.com/github/chiditarod/cartographer/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/0f8b7b85f89b0024665a/test_coverage)](https://codeclimate.com/github/chiditarod/cartographer/test_coverage)

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
GOOGLE_API_KEY=... bundle exec rails c
```

### Generate all Legs using Google Maps API

```ruby
BulkLegCreator.perform_now(Location.pluck(:id))
```

### Generate Routes

```ruby
RouteGenerator.call(Race.first)
winners = Route.complete
puts winners.map(&:to_csv)
puts winners.map(&:to_s)
```

### Geocode Locations using Google Maps API

```ruby
GeocodeLocationJob.perform_now(Location.pluck(:id))
```

### Clean things up

```ruby
Race.destroy_all; Route.destroy_all; Leg.destroy_all; Location.destroy_all; Leg.destroy_all; nil
```


## Developer Setup

*Tested using OSX Mojave 10.14.2*.

Prerequisites

- [Xcode](https://itunes.apple.com/us/app/xcode/id497799835),
  [Docker](https://docs.pie.apple.com/artifactory/docker.html), [Homebrew](https://brew.sh/)

Install rbenv & Ruby

```bash
brew install rbenv
rbenv install $(cat .ruby-version)
gem install bundler
```

Install Gems

```bash
brew install libffi libpq

bundle config --local build.ffi --with-ldflags="-L/usr/local/opt/libffi/lib"
bundle config --local build.pg --with-opt-dir="/usr/local/opt/libpq"
export PKG_CONFIG_PATH="$PKG_CONFIG_PATH:/usr/local/opt/libffi/lib/pkgconfig"

bundle install
```

