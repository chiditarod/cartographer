# frozen_string_literal: true

namespace :frontend do
  desc "Build the React frontend for production"
  task :build do
    Dir.chdir(Rails.root.join('frontend')) do
      sh 'npm install'
      sh 'npm run build'
    end
  end

  desc "Install frontend dependencies"
  task :install do
    Dir.chdir(Rails.root.join('frontend')) do
      sh 'npm install'
    end
  end
end
