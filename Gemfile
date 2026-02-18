source 'https://rubygems.org'
git_source(:github) { |repo| "https://github.com/#{repo}.git" }

ruby '3.4.8'

gem 'rails', '~> 8.0.0'
gem 'pg'
gem 'puma', '>= 6.0'
# Use SCSS for stylesheets
gem 'sass-rails', '>= 6'
# Use Uglifier as compressor for JavaScript assets
gem 'uglifier', '>= 1.3.0'
gem 'coffee-script'

gem 'bootstrap', '~> 4.4.1'
gem 'jquery-rails'
gem 'sprockets-rails'

# Turbolinks makes navigating your web application faster. Read more: https://github.com/turbolinks/turbolinks
gem 'turbolinks', '~> 5'
# Build JSON APIs with ease. Read more: https://github.com/rails/jbuilder
gem 'jbuilder', '~> 2.7'

# Reduces boot times through caching; required in config/boot.rb
gem 'bootsnap', '>= 1.12.0', require: false

gem 'google_maps_service'
gem 'rack-cors'

group :development, :test do
  gem 'byebug', platforms: [:mri]
  gem 'factory_bot_rails'
  gem 'faker'
  gem 'awesome_print'
  gem 'rspec-rails'
end

group :development do
  gem 'web-console', '>= 4.1.0'
  gem 'listen', '~> 3.3'
end

group :test do
  gem 'capybara', '>= 3.26'
  gem 'selenium-webdriver'
  gem 'webdrivers'
  gem 'simplecov'
  gem 'rspec_junit_formatter'
end

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem 'tzinfo-data', platforms: [:windows, :jruby]
