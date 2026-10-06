require File.expand_path('../../../test_helper', __FILE__)

class RedmineUserSpecificTheme::UserPreferenceTest < ActiveSupport::TestCase
  fixtures :users, :user_preferences

  def test_user_ui_theme_is_stored_in_others
    user = User.find(1)
    user.pref.others[:ui_theme] = 'ust_alpha'
    user.pref.save!
    assert_equal 'ust_alpha', User.find(1).pref.others[:ui_theme]
  end

  def test_user_preference_has_no_ui_theme_attribute
    assert_not UserPreference.new.respond_to?(:ui_theme)
  end
end
