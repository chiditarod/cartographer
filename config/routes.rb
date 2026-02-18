# frozen_string_literal: true

# For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html

Rails.application.routes.draw do
  get 'home/index'
  root 'home#index'

  resources :races, only: [:index] do
    resources :routes, only: [:index, :show]
  end
end
