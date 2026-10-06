# Two throw-away themes in themes/ (Redmine 7 scans that directory at boot, so this
# runs before the server starts). e2e_red and e2e_blue differ in header colour and
# e2e_blue ships its own icon sprite (a copy of the core one, with a marker comment).
core_sprite = Rails.root.join('app/assets/images/icons.svg')
{'e2e_red' => '#c0392b', 'e2e_blue' => '#2980b9'}.each do |dir, color|
  base = Rails.root.join('themes', dir)
  FileUtils.mkdir_p(base.join('stylesheets'))
  File.write(base.join('stylesheets', 'application.css'),
             "@import url(\"../../../stylesheets/application.css\");\n" \
             "#header, #top-menu { background-color: #{color} !important; }\n")
  if dir == 'e2e_blue' && core_sprite.exist?
    FileUtils.mkdir_p(base.join('images'))
    File.write(base.join("images", "icons.svg"), core_sprite.read.sub("?>", "?>\n<!-- e2e_blue sprite -->"))
  end
end
Setting.ui_theme = ''
%w(admin manager reporter outsider).each do |login|
  pref = User.find_by(login: login).pref
  pref.others.delete(:ui_theme)
  pref.save!
end
