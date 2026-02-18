# frozen_string_literal: true

Rails.application.routes.draw do
  # API endpoints
  namespace :api do
    namespace :v1 do
      resources :locations
      resources :races do
        resources :routes, only: [:index, :show, :update, :destroy]
        post 'generate_legs', to: 'operations#generate_legs'
        post 'generate_routes', to: 'operations#generate_routes'
      end
      resources :legs, only: [:index, :destroy]
      post 'geocode', to: 'operations#geocode'
      get 'geocode_search', to: 'geocode_search#search'
      resources :job_statuses, only: [:show]
      get 'stats', to: 'stats#index'
    end
  end

  # Legacy routes
  get 'home/index'
  root 'home#index'

  resources :races, only: [:index] do
    resources :routes, only: [:index, :show]
  end

  # SPA catch-all (must be last)
  get '*path', to: 'spa#index', constraints: ->(req) {
    !req.xhr? && req.format.html? && !req.path.start_with?('/api/')
  }
end
