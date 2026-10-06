require_dependency 'my_controller'

module RedmineUserSpecificTheme
  module Patches
    module UserPreferencePatch
      def account
        Rails.logger.info "Account with theme patch applied"
        if request.put? && params[:pref]
          theme = params[:pref][:ui_theme]
          # an installed theme sets it, blank falls back on the global theme,
          # anything else is ignored and keeps the current choice
          if theme.is_a?(String) && (theme.blank? || Redmine::Themes.theme(theme, :rescan => false))
            User.current.pref.others[:ui_theme] = theme.presence
          end
          User.current.pref.save
          Rails.logger.info "Saved theme: #{theme}"
        end
        super
      end

    end
  end
end
