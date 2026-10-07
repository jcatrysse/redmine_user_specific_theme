require File.expand_path('../../../test_helper', __FILE__)

class RedmineUserSpecificTheme::ApplicationHelperTest < ActiveSupport::TestCase
  include RedmineUserSpecificTheme::ThemeFixtures
  fixtures :users, :user_preferences
  include ApplicationHelper

  def setup
    install_test_themes
    # redmine_theme_changer (installed during the switch, Jan 2026-10-07) keeps its own
    # per-user rows and its fixtures stay in the test database; these tests are about this plugin
    if ActiveRecord::Base.connection.table_exists?('theme_changer_user_settings')
      ActiveRecord::Base.connection.execute('DELETE FROM theme_changer_user_settings')
    end
    @user = User.find(1)
    User.current = @user
    @standard_theme = Redmine::Themes.theme('ust_alpha')
    Setting[:ui_theme] = @standard_theme.id
    @user_theme = Redmine::Themes.theme('ust_beta gamma')
    self.stubs(:controller_name).returns('fakecontroller')
    self.stubs(:action_name).returns('fakeaction')
    self.stubs(:display_main_menu?).returns(false)
  end

  def teardown
    Setting[:ui_theme] = ''
    User.current = nil
    remove_test_themes
  end

  def test_current_theme_match_user_specific_theme
    @user.pref.others[:ui_theme] = @user_theme.id
    @user.pref.save!

    assert_equal @user_theme.id, current_theme.id
    assert_match(/.*theme-#{@user_theme.name.tr(' ', '_')}.*/, body_css_classes)
  end

  def test_current_theme_with_nil_user_specific_theme
    @user.pref.others[:ui_theme] = nil
    @user.pref.save!

    assert_equal @standard_theme.id, current_theme.id
    assert_match(/.*theme-#{@standard_theme.name.tr(' ', '_')}.*/, body_css_classes)
  end

  def test_current_theme_with_wrong_user_specific_theme
    @user.pref.others[:ui_theme] = 'wrong'
    @user.pref.save!

    assert_equal @standard_theme.id, current_theme.id
    assert_match(/.*theme-#{@standard_theme.name.tr(' ', '_')}.*/, body_css_classes)
  end

  def test_body_css_class_replaces_spaces_like_core
    @user.pref.others[:ui_theme] = @user_theme.id
    @user.pref.save!

    assert_includes body_css_classes.split, 'theme-Ust_beta_gamma'
  end

  def test_body_css_class_replaces_only_the_global_theme_class
    @user.pref.others[:ui_theme] = @user_theme.id
    @user.pref.save!

    classes = body_css_classes.split
    assert_equal ['theme-Ust_beta_gamma'], classes.select { |css| css.start_with?('theme-') }
    assert_not_includes classes, 'theme-Ust_alpha'
    assert_includes classes, 'controller-fakecontroller'
  end

  def test_body_css_class_is_added_when_the_global_theme_is_blank
    Setting[:ui_theme] = ''
    @user.pref.others[:ui_theme] = @user_theme.id
    @user.pref.save!

    assert_equal 1, body_css_classes.split.count { |css| css.start_with?('theme-') }
    assert_includes body_css_classes.split, 'theme-Ust_beta_gamma'
  end

  def test_body_css_class_without_any_theme_has_no_theme_class
    Setting[:ui_theme] = ''

    assert_not_includes body_css_classes, 'theme-'
  end

  def test_anonymous_gets_the_global_theme
    User.current = User.anonymous

    assert_equal @standard_theme.id, current_theme.id
  end
end
