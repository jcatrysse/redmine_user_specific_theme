require 'application_helper'

module RedmineUserSpecificTheme::Patches
  module ApplicationHelperPatch
    extend ActiveSupport::Concern

    def current_theme
      user_theme = super
      user_theme = Redmine::Themes.theme(User.current.pref.others[:ui_theme])
      user_theme || Redmine::Themes.theme(Setting.ui_theme)
    end

    def body_css_classes
      css_classes = super
      user_theme = Redmine::Themes.theme(User.current.pref.others[:ui_theme])
      return css_classes unless user_theme
      # core adds the class only for the global theme, which may be blank
      global_theme = Redmine::Themes.theme(Setting.ui_theme)
      global_class = global_theme && "theme-#{global_theme.name.tr(' ', '_')}"
      others = css_classes.split.reject { |css| css == global_class }
      ["theme-#{user_theme.name.tr(' ', '_')}", *others].join(' ')
    end

  end
end
