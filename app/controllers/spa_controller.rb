# frozen_string_literal: true

class SpaController < ActionController::Base
  def index
    if Rails.env.development?
      redirect_to "http://localhost:5173#{request.fullpath}", allow_other_host: true
    else
      spa_path = Rails.root.join('public', 'spa', 'index.html')
      if File.exist?(spa_path)
        render file: spa_path, layout: false, content_type: 'text/html'
      else
        render plain: 'SPA not built. Run: cd frontend && npm run build', status: :service_unavailable
      end
    end
  end
end
