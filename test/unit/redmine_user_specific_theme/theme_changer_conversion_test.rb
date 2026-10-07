require File.expand_path('../../../test_helper', __FILE__)

class RedmineUserSpecificTheme::ThemeChangerConversionTest < ActiveSupport::TestCase
  include RedmineUserSpecificTheme::ThemeFixtures
  fixtures :users, :user_preferences

  Conversion = RedmineUserSpecificTheme::ThemeChangerConversion
  Row = Conversion::UserSetting

  def setup
    install_test_themes
    # same table as redmine_theme_changer's migration 0001, when that plugin is absent
    unless Row.connection.table_exists?(Conversion::TABLE)
      Row.connection.create_table(Conversion::TABLE) do |t|
        t.column :user_id, :integer
        t.column :theme, :string
        t.column :updated_at, :timestamp
      end
    end
    Row.reset_column_information
    Row.delete_all
    UserPreference.find_each do |pref|
      pref.others.delete(:ui_theme)
      pref.save!
    end
    choose(2, 'ust_alpha')
    choose(3, 'ust_beta gamma')
    choose(4, 'purplemine2')
    choose(5, '')
  end

  def teardown
    remove_test_themes
  end

  def choose(user_id, theme)
    pref = User.find(user_id).pref
    pref.others[:ui_theme] = theme
    pref.save!
  end

  def themes
    Row.order(:user_id).pluck(:user_id, :theme)
  end

  def run_task(action, env = {})
    out = StringIO.new
    counts = Conversion.run(action, env, out)
    [counts, out.string]
  end

  def test_convert_copies_every_installed_choice
    counts, out = run_task(:convert)

    assert_equal [[2, 'ust_alpha'], [3, 'ust_beta gamma']], themes
    assert_equal 2, counts[:created]
    assert_equal 1, counts[:skipped]
    assert_include 'skipped: user 4: purplemine2 (not installed)', out
    assert_equal 'ust_alpha', User.find(2).pref.others[:ui_theme], 'the source stays as it is'
  end

  def test_convert_maps_a_replaced_theme
    run_task(:convert, 'THEME_MAP' => 'purplemine2:ust_alpha')

    assert_equal [[2, 'ust_alpha'], [3, 'ust_beta gamma'], [4, 'ust_alpha']], themes
  end

  def test_convert_is_idempotent
    run_task(:convert)
    counts, = run_task(:convert)

    assert_equal [[2, 'ust_alpha'], [3, 'ust_beta gamma']], themes
    assert_equal 2, counts[:unchanged]
    assert_equal 0, counts[:created]
  end

  def test_convert_keeps_a_choice_made_in_theme_changer
    Row.create!(:user_id => 2, :theme => 'ust_beta gamma')
    counts, = run_task(:convert)

    assert_equal [[2, 'ust_beta gamma'], [3, 'ust_beta gamma']], themes
    assert_equal 1, counts[:kept]
  end

  def test_convert_replaces_use_system_setting
    Row.create!(:user_id => 2, :theme => '__system_setting__')
    counts, = run_task(:convert)

    assert_equal [[2, 'ust_alpha'], [3, 'ust_beta gamma']], themes
    assert_equal 1, counts[:updated]
  end

  def test_revert_removes_only_the_converted_rows
    run_task(:convert)
    Row.where(:user_id => 3).update_all(:theme => 'ust_alpha')
    Row.create!(:user_id => 1, :theme => '__system_setting__')
    counts, = run_task(:revert)

    assert_equal [[1, '__system_setting__'], [3, 'ust_alpha']], themes
    assert_equal 1, counts[:removed]
    assert_equal 1, counts[:kept]
  end

  def test_convert_then_revert_restores_the_start
    Row.create!(:user_id => 1, :theme => 'ust_alpha')
    before = themes
    run_task(:convert, 'THEME_MAP' => 'purplemine2:ust_alpha')
    run_task(:revert, 'THEME_MAP' => 'purplemine2:ust_alpha')

    assert_equal before, themes
  end

  def test_dry_run_saves_nothing
    counts, out = run_task(:convert, 'DRY_RUN' => '1')

    assert_equal [], themes
    assert_equal 2, counts[:created]
    assert_include 'DRY RUN, nothing saved: 2 created, 1 skipped', out
  end

  def test_string_key_in_others_is_read_too
    pref = User.find(2).pref
    pref.others.delete(:ui_theme)
    pref.others['ui_theme'] = 'ust_beta gamma'
    pref.save!
    run_task(:convert)

    assert_equal 'ust_beta gamma', Row.find_by(:user_id => 2).theme
  end

  def test_missing_theme_changer_table_is_refused
    Row.connection.drop_table(Conversion::TABLE)
    error = assert_raise(RuntimeError) { run_task(:convert) }
    assert_match(/install redmine_theme_changer/, error.message)
  end

  def test_bad_theme_map_is_refused
    assert_raise(ArgumentError) { Conversion.parse_map('purplemine2') }
    assert_equal({'a' => 'b', 'c' => 'd'}, Conversion.parse_map('a:b, c:d'))
    assert_equal({}, Conversion.parse_map(nil))
  end

  def test_rake_tasks_are_defined
    require 'rake'
    Rake::Task.clear
    Rails.application.load_tasks
    assert Rake::Task.task_defined?('redmine_user_specific_theme:convert_to_theme_changer')
    assert Rake::Task.task_defined?('redmine_user_specific_theme:revert_theme_changer_conversion')
  end
end
