require File.expand_path('../../../test_helper', __FILE__)

class RedmineUserSpecificTheme::ApplicationHelperTest < ActiveSupport::TestCase
  include RedmineUserSpecificTheme::ThemeFixtures
  fixtures :users, :user_preferences
  include ApplicationHelper

  def setup
    install_test_themes
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

  def test_anonymous_gets_the_global_theme
    User.current = User.anonymous

    assert_equal @standard_theme.id, current_theme.id
  end
end
