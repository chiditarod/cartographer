# frozen_string_literal: true

class GoogleApiClient

  attr_reader :client

  def initialize
    unless ENV['GOOGLE_API_KEY']
      raise StandardEror.new("GOOGLE_API_KEY env var is required to use Google API")
    end

    @client ||= GoogleMapsService::Client.new(
      key: ENV['GOOGLE_API_KEY'],
      retry_timeout: 20,
      queries_per_second: 10
    )
  end
end
