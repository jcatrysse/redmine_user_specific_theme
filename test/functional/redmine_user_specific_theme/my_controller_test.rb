require File.expand_path('../../../test_helper', __FILE__)

class RedmineUserSpecificTheme::MyControllerTest < Redmine::ControllerTest
  include RedmineUserSpecificTheme::ThemeFixtures
  tests MyController
  fixtures :users, :email_addresses, :user_preferences, :roles, :projects, :members, :member_roles,
           :issues, :issue_statuses, :trackers, :enumerations, :custom_fields,
           :auth_sources

  def setup
    install_test_themes
    @request.session[:user_id] = 2
    Setting[:ui_theme] = ''
    User.find(2).tap { |u| u.pref.others[:ui_theme] = nil; u.pref.save! }
  end

  def teardown
    remove_test_themes
  end

  def test_update_user_ui_theme
    put :account, :params => {:pref => {:ui_theme => 'ust_alpha'}}

    assert_redirected_to '/my/account'
    assert_equal 'ust_alpha', User.find(2).pref.others[:ui_theme]
  end

  def test_update_user_ui_theme_to_blank_clears_it
    User.find(2).tap { |u| u.pref.others[:ui_theme] = 'ust_alpha'; u.pref.save! }

    put :account, :params => {:pref => {:ui_theme => ''}}

    assert_redirected_to '/my/account'
    assert_nil User.find(2).pref.others[:ui_theme].presence
  end

  def test_update_with_unknown_theme_is_not_stored
    put :account, :params => {:pref => {:ui_theme => '../../etc/passwd'}}

    assert_nil User.find(2).pref.others[:ui_theme].presence
  end

  def test_update_with_unknown_theme_keeps_the_current_theme
    User.find(2).tap { |u| u.pref.others[:ui_theme] = 'ust_alpha'; u.pref.save! }

    put :account, :params => {:pref => {:ui_theme => 'nosuchtheme'}}

    assert_equal 'ust_alpha', User.find(2).pref.others[:ui_theme]
  end

  def test_update_with_array_theme_is_not_stored
    put :account, :params => {:pref => {:ui_theme => ['ust_alpha']}}

    assert_nil User.find(2).pref.others[:ui_theme].presence
  end

  def test_update_with_array_theme_keeps_the_current_theme
    User.find(2).tap { |u| u.pref.others[:ui_theme] = 'ust_alpha'; u.pref.save! }

    put :account, :params => {:pref => {:ui_theme => ['ust_beta gamma']}}

    assert_equal 'ust_alpha', User.find(2).pref.others[:ui_theme]
  end

  def test_update_without_theme_param_keeps_the_theme
    User.find(2).tap { |u| u.pref.others[:ui_theme] = 'ust_alpha'; u.pref.save! }

    put :account, :params => {:pref => {:time_zone => 'UTC'}}

    assert_equal 'ust_alpha', User.find(2).pref.others[:ui_theme]
  end

  def test_theme_is_not_changed_by_get
    get :account, :params => {:pref => {:ui_theme => 'ust_alpha'}}

    assert_nil User.find(2).pref.others[:ui_theme].presence
  end

  def test_show_ui_theme
    User.find(2).tap { |u| u.pref.others[:ui_theme] = 'ust_alpha'; u.pref.save! }

    get :account

    assert_response :success
    assert_select 'select[name=?]', 'pref[ui_theme]' do
      assert_select 'option', :count => Redmine::Themes.themes.size + 1
      assert_select 'option[selected=selected][value=?]', 'ust_alpha'
    end
  end

  def test_user_stylesheet_is_used_on_the_page
    User.find(2).tap { |u| u.pref.others[:ui_theme] = 'ust_alpha'; u.pref.save! }

    get :account

    assert_select 'link[rel=stylesheet][href*=?]', 'themes/ust_alpha/application'
  end
end
