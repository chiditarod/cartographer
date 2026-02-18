require 'rails_helper'

RSpec.describe 'Races', type: :request do

  describe 'GET /' do
    it 'returns a successful response' do
      get root_path
      expect(response).to have_http_status(:success)
    end

    it 'renders the home page' do
      get root_path
      expect(response.body).to include('Home#index')
    end
  end
end
