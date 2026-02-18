# Cartographer

Ruby on Rails app that finds viable routes for the CHIditarod, based on
customizable criteria like leg length, overall race length, etc.

[![CI Build Status](https://dl.circleci.com/status-badge/img/gh/chiditarod/cartographer/tree/master.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/gh/chiditarod/cartographer/tree/master) [![Maintainability](https://api.codeclimate.com/v1/badges/0f8b7b85f89b0024665a/maintainability)](https://codeclimate.com/github/chiditarod/cartographer/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/0f8b7b85f89b0024665a/test_coverage)](https://codeclimate.com/github/chiditarod/cartographer/test_coverage)

## Runtime Environment

| Variable Name | Purpose |
| ---- | ------- |
| `GOOGLE_API_KEY` | Google Cloud Platform API key with access to the APIs listed below. |
| `MOCK_MAP` | When `true`, use mock data instead of calling Google APIs. Useful for local development without an API key. |

### Google API Setup

Your Google Cloud Platform account and associated [API key](https://console.cloud.google.com/apis/credentials) must have access to the following APIs:

- [Distance Matrix API](https://developers.google.com/maps/documentation/distance-matrix/intro)
- [Geocoding API](https://developers.google.com/maps/documentation/geocoding/start)
- [Static Maps API](https://developers.google.com/maps/documentation/maps-static/intro)

## Developer Setup

*Tested on macOS Sequoia 15.1.1.*

### Prerequisites

- [Xcode](https://itunes.apple.com/us/app/xcode/id497799835),
  [Docker](https://www.docker.com), [Homebrew](https://brew.sh/),
  [Node.js](https://nodejs.org/) (for the frontend)

### Install rbenv & Ruby

```bash
brew install rbenv
rbenv install $(cat .ruby-version)
gem install bundler
```

### Install Gems

```bash
brew install libffi libpq

bundle config --local build.ffi --with-ldflags="-L/opt/homebrew/opt/libffi/lib"
export PKG_CONFIG_PATH="$PKG_CONFIG_PATH:/opt/homebrew/opt/libffi/lib/pkgconfig"

bundle config --local build.pg --with-opt-dir="/opt/homebrew/opt/libpq"
export PKG_CONFIG_PATH="$PKG_CONFIG_PATH:/opt/homebrew/opt/libpq/lib/pkgconfig"

bundle install
```

### Install Frontend Dependencies

```bash
cd frontend && npm install
```

### Database Setup

Start the PostgreSQL container and set up the database:

```bash
docker compose up -d db
bundle exec rails db:create db:migrate
bundle exec rake db:seed       # optional: seeds sample locations
```

## Booting the App Locally

You need two processes running — the Rails API server and the Vite dev server.

### 1. Start Rails (API)

Without a Google API key (mock mode):

```bash
MOCK_MAP=true bundle exec rails server
```

With a real Google API key:

```bash
GOOGLE_API_KEY=your-key-here bundle exec rails server
```

Rails starts on **http://localhost:3000**.

### 2. Start Vite (Frontend)

```bash
cd frontend && npm run dev
```

Vite starts on **http://localhost:5173** and proxies `/api` requests to Rails.

### Open the App

Navigate to **http://localhost:5173** in your browser.

## Running Tests

### RSpec (Backend)

```bash
bundle exec rspec
```

### Playwright (E2E)

```bash
RAILS_ENV=test bundle exec rake e2e:seed   # seed test data
cd e2e && npx playwright test --reporter=list
RAILS_ENV=test bundle exec rake e2e:clean  # clean up after
```

### Frontend Build Check

```bash
cd frontend && npm run build
```

## Usage via Rails Console

The web UI handles all of the below, but you can also use the Rails console directly.

### Seed

```bash
bundle exec rake db:seed
GOOGLE_API_KEY=... bundle exec rails c
```

### Generate Legs using Google Maps API

```ruby
BulkLegCreator.perform_now(Location.pluck(:id))
```

### Generate Routes

```ruby
RouteGenerator.call(Race.first)
winners = Route.complete
puts winners.map(&:to_csv)
puts winners.map(&:to_s)

selected = winners.select { |r| r.name != nil }
selected.map(&:to_csv)
```

### Geocode Locations using Google Maps API

```ruby
GeocodeLocationJob.perform_now(Location.pluck(:id))
```

### Create Route Maps

After selecting and naming routes, generate maps via the Google Maps API:

```ruby
names = [
  [771,"A"],[778,"H"],[806,"J"],[809,"K"],[816,"L"],[890,"G"],
  [931,"I"],[991,"D"],[1013,"B"],[1051,"C"],[1058,"E"],[1134,"F"]
]

names.each do |n|
  r = Route.find(n[0])
  r.update!(name: n[1])
  puts "Route ID #{r.id} now has name #{r.name}"
end
```

Then visit routes in the browser:

```
http://localhost:3000/races/3/routes/771
```

### Clean Up

```ruby
Race.destroy_all; Route.destroy_all; Leg.destroy_all; Location.destroy_all; nil
```
