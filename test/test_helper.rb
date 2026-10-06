require File.expand_path(File.dirname(__FILE__) + '../../../../test/test_helper')

# Redmine 7 scans themes/ only, and a bare checkout ships no theme. The tests
# install two throw-away themes there and remove them again.
module RedmineUserSpecificTheme
  module ThemeFixtures
    THEMES = ['ust_alpha', 'ust_beta gamma'].freeze

    def install_test_themes
      THEMES.each do |dir|
        css = Rails.root.join('themes', dir, 'stylesheets')
        FileUtils.mkdir_p(css)
        File.write(css.join('application.css'), "/* #{dir} */\n")
      end
      Redmine::Themes.rescan
    end

    def remove_test_themes
      THEMES.each { |dir| FileUtils.rm_rf(Rails.root.join('themes', dir)) }
      Redmine::Themes.rescan
    end
  end
end
