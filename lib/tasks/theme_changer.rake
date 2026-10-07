namespace :redmine_user_specific_theme do
  desc 'Copy every user theme to redmine_theme_changer (THEME_MAP=old:new,... DRY_RUN=1)'
  task :convert_to_theme_changer => :environment do
    RedmineUserSpecificTheme::ThemeChangerConversion.run(:convert)
  end

  desc 'Remove the redmine_theme_changer rows the conversion added (THEME_MAP=old:new,... DRY_RUN=1)'
  task :revert_theme_changer_conversion => :environment do
    RedmineUserSpecificTheme::ThemeChangerConversion.run(:revert)
  end
end
