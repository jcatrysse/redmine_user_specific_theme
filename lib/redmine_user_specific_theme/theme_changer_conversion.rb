module RedmineUserSpecificTheme
  # Copies every user's theme from this plugin (user_preferences.others[:ui_theme])
  # to redmine_theme_changer (one row per user in theme_changer_user_settings).
  # The source is left untouched, so the conversion can run again (it only adds
  # what is missing) and can be reverted (it removes only the rows it would add).
  class ThemeChangerConversion
    TABLE = 'theme_changer_user_settings'
    # theme_changer's "use system setting", the same as no row; its My account form
    # saves it for every user who saves the form while both plugins are installed
    SYSTEM_SETTING = '__system_setting__'

    class UserSetting < ActiveRecord::Base
      self.table_name = TABLE
    end

    attr_reader :counts

    # map: {'old theme id' => 'new theme id'}, e.g. {'purplemine2' => 'opale'}
    def initialize(map: {}, out: $stdout)
      @map = map
      @out = out
      @counts = Hash.new(0)
    end

    # what the rake tasks run: action is :convert or :revert
    def self.run(action, env = ENV, out = $stdout)
      conversion = new(:map => parse_map(env['THEME_MAP']), :out => out)
      dry_run = env['DRY_RUN'].present?
      ActiveRecord::Base.transaction do
        conversion.send(action)
        raise ActiveRecord::Rollback if dry_run
      end
      totals = conversion.counts.map { |what, count| "#{count} #{what}" }.join(', ')
      out.puts "#{'DRY RUN, nothing saved: ' if dry_run}#{totals.presence || 'no user has a theme'}"
      conversion.counts
    end

    def self.parse_map(value)
      value.to_s.split(',').each_with_object({}) do |pair, map|
        from, to = pair.split(':', 2).map(&:strip)
        raise ArgumentError, "THEME_MAP entry '#{pair}' is not old:new" if from.blank? || to.blank?
        map[from] = to
      end
    end

    def convert
      each_choice do |user_id, theme|
        row = UserSetting.find_by(:user_id => user_id)
        if row.nil?
          UserSetting.create!(:user_id => user_id, :theme => theme, :updated_at => Time.now)
          report :created, user_id, theme
        elsif row.theme == theme
          report :unchanged, user_id, theme
        elsif row.theme == SYSTEM_SETTING
          row.update_columns(:theme => theme, :updated_at => Time.now)
          report :updated, user_id, "#{theme} (was #{SYSTEM_SETTING})"
        else
          report :kept, user_id, "#{theme} (theme_changer already has '#{row.theme}')"
        end
      end
    end

    def revert
      each_choice do |user_id, theme|
        row = UserSetting.find_by(:user_id => user_id)
        if row && row.theme == theme
          row.delete
          report :removed, user_id, theme
        else
          report :kept, user_id, "#{theme} (theme_changer has #{row ? "'#{row.theme}'" : 'no row'})"
        end
      end
    end

    private

    def each_choice
      unless UserSetting.connection.table_exists?(TABLE)
        raise "#{TABLE} does not exist: install redmine_theme_changer and run redmine:plugins:migrate first"
      end
      UserPreference.joins(:user).find_each do |pref|
        source = pref.others[:ui_theme] || pref.others['ui_theme']
        next if source.blank?
        theme = Redmine::Themes.theme(@map.fetch(source, source), :rescan => false)
        if theme
          yield pref.user_id, theme.id
        else
          # this plugin falls back on the global theme, theme_changer would show none
          report :skipped, pref.user_id, "#{@map.fetch(source, source)} (not installed)"
        end
      end
      @counts
    end

    def report(what, user_id, detail)
      @counts[what] += 1
      @out.puts "#{what}: user #{user_id}: #{detail}"
    end
  end
end
