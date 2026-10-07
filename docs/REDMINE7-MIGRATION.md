# Redmine 7 migration: redmine_user_specific_theme

Start a Claude Code (or Codex) session on this repository, branch `redmine70-migration`, with:

> Read CLAUDE.md and docs/REDMINE7-MIGRATION.md, then carry out the Redmine 7 migration of this
> plugin as described there, on branch redmine70-migration. That includes the plugin's tests on
> PostgreSQL, every function exercised end to end on a real running Redmine in a
> browser (with and without permissions, failure paths included) with screenshots you looked at,
> and an OpenAI review of the diff when OPENAI_API_KEY is set. Report to me in Dutch at the end.

This file is the plan and the memory of that work. Update it as you go: verdicts, results,
what is left. Written 2026-10-06 from a measured analysis (report at the bottom).

## Status

| | |
|---|---|
| Plugin id | `redmine_user_specific_theme` |
| GEOxyz runs today | `compatibility-with-redmine-5` |
| Upstream | Restream/redmine_user_specific_theme (ex-Undev) master @ 9e3cdc3 (2017-07-06) |
| Runs on Redmine 7 as is | JA (tests were stale, fixed); **replaced by redmine_theme_changer 0.7.1 in production (Jan, q1, 2026-10-07)**: this repo carries the conversion |
| Upstream sync | UPSTREAM DOOD: niets; onderhouden alternatief haru/redmine_theme_changer 0.7.1 (claimt 7.0) vraagt een migratie van user_preferences.others[:ui_theme] |
| After sync | n.v.t. |
| Complexity (1 trivial .. 5 rewrite) | 2 |
| Measured on | Redmine 7.0.1 (7.0-stable-GEOxyz), Rails 8.1.3.1, Ruby 3.3.6, PostgreSQL 16.15 (2026-10-07; MariaDB 10.11 on 2026-10-06, no longer required) |
| Theme | PurpleMine2 replaced by Opale 1.7.2 (Jan, q2, 2026-10-07); works on 7.0, cosmetic findings below |
| Branch head when this file was written | see `git log` (updated 2026-10-07) |

## Already on this branch

- Stale tests rewritten for `pref.others[:ui_theme]` with throw-away themes in `themes/` (6 -> 20 tests).
- Account patch stores only an installed theme id (blank clears, anything else is ignored and keeps the current choice).
- Body class: `theme-<name with _ for spaces>` like core 7.0, and added when the global theme is blank (core adds it only for the global theme).
- e2e scenario `test/e2e/user_theme.mjs` and seed `test/e2e/seed.rb`.
- **Decision q1 (2026-10-07)**: rake tasks `redmine_user_specific_theme:convert_to_theme_changer` and
  `redmine_user_specific_theme:revert_theme_changer_conversion` (`lib/redmine_user_specific_theme/theme_changer_conversion.rb`,
  `lib/tasks/theme_changer.rake`), 12 tests (`56a5bef`, later the clearer "kept" message on revert).
  e2e: `test/e2e/user_theme_to_theme_changer.mjs` (both plugins installed, the conversion run through rake),
  `test/e2e-after-removal/theme_changer.mjs` (this plugin removed). See "Switch to redmine_theme_changer".
- **Decision q2 (2026-10-07)**: e2e `test/e2e-after-removal/opale.mjs` with Opale 1.7.2 in `themes/opale`.
  See "Opale on Redmine 7".
- `test/e2e/core_pages.mjs`: Project > Settings, issue list, issue page, My account with all GEOxyz plugins.

## Result of the migration session (2026-10-06, Redmine 7.0-stable-GEOxyz, Rails 8.1, Ruby 3.3.6)

Baseline before any change: minitest 6 runs, 3 assertions, 0 failures, 6 errors (PostgreSQL), as the analysis said.

| | PostgreSQL 16 | MariaDB 10.11 |
|---|---|---|
| plugin tests (minitest; no rspec in this plugin) | 20 runs, 46 assertions, 0 failures, 0 errors | 20 runs, 46 assertions, 0 failures, 0 errors |
| e2e smoke (1 plugin route, 10 screenshots) | 0 problems | 0 problems |
| e2e core flows (6 screenshots) | 0 problems | 0 problems |
| e2e `user_theme.mjs` (12 screenshots, 29 assertions (28 + the sprite content-type check)) | 0 problems | 0 problems |

Committed screenshots in `docs/e2e/` come from the MariaDB run; the PostgreSQL run wrote to a scratch directory. Every new test was shown to fail without its fix (4 and then 3 failures on the old code). Boot and production-mode eager load: the e2e server runs in production mode. No migrations in this plugin, so no up/down. Not run: Redmine 5.1 (the fixes only use APIs that exist in 5.1, unverified), together with the other GEOxyz plugins (not available in this session), before pictures on 5.1.

Webhooks (Redmine 7): the plugin does not touch issue data or hooks, so nothing to do.

OpenAI review: `docs/reviews/openai-2026-10-06-986eb8d.md`, 3 findings, all resolved there (1 false blocker, 1 not applicable, 1 fixed with a test).

## Result of the decision session (2026-10-07, Redmine 7.0-stable-GEOxyz, Rails 8.1.3.1, Ruby 3.3.6, PostgreSQL 16.15)

| | alone | with redmine_theme_changer 0.7.1 | with all GEOxyz plugins (43) + theme_changer |
|---|---|---|---|
| this plugin's tests (minitest) | 32 runs, 75 assertions, 0 failures, 0 errors (theme_changer table absent, the tests create it) | 32 runs, 75 assertions, 0 failures, 0 errors | 32 runs, 75 assertions, 0 failures, 0 errors |
| redmine_theme_changer's own tests | | 8 runs, 23 assertions, 0 failures, 0 errors | |

e2e, production mode (`docs/e2e/`, and `docs/e2e/geoxyz-all/` for the combination), 7 scenarios, 77 screenshots per run:

| scenario | screenshots | main run | all GEOxyz plugins |
|---|---|---|---|
| `.codex/e2e/smoke.mjs` | 10 | 0 problems | 0 problems |
| `.codex/e2e/core.mjs` | 6 | 0 problems | 1: `/issues/1` as reporter 403, redmine_view_issue_description (by design, recorded in redmine_parent_child_filters' plan) |
| `test/e2e/core_pages.mjs` | 10 | 0 problems | 0 problems (Project > Settings, issue list, issue page 200 for admin and manager; run again after removing this plugin: 0 problems) |
| `test/e2e/user_theme.mjs` | 12 | 0 problems | 0 problems |
| `test/e2e/user_theme_to_theme_changer.mjs` (q1, both plugins) | 7 | 0 problems | 0 problems |
| `test/e2e-after-removal/theme_changer.mjs` (q1, this plugin removed) | 13 | 0 problems | 0 problems |
| `test/e2e-after-removal/opale.mjs` (q2) | 15 + 4 mobile | 0 problems | 1: the same reporter 403 from redmine_view_issue_description |

Review: own adversarial review of the new commits (one inaccurate comment, fixed in `d4cf2b6`), then
the OpenAI review of `f9c3dc7..d4cf2b6`: `docs/reviews/openai-2026-10-07-d4cf2b6.md`, no findings.
Revert caveat: a row that already held the same theme before the conversion is removed by the revert too.

Every screenshot was opened and looked at (contact sheets per scenario, the Opale and conversion pages
one by one). Rake output of the conversion run (both runs identical):
`DRY RUN, nothing saved: 2 updated, 1 created` / `2 updated, 1 created` / `3 unchanged` /
revert `2 removed, 1 kept` (reporter's later "Default" kept) / `2 created, 1 unchanged`.

Combination: the 34 public jcatrysse plugins with a `redmine70-migration` branch plus the private
redmine_zenedit, redmine_agile, redmine_contacts, redmine_checklists, redmine_people,
redmine_contacts_helpdesk, redmine_tags (id redmineup_tags) and redmine_ai_triage (heads of 2026-10-07; 42 plugins besides this one), redmine_theme_changer 0.7.1, Opale.
Findings, none in this plugin (it uses `prepend` only):
- **redmine_tags (redmineup_tags) + redmine_issue_field_visibility**: the `redmineup` gem 1.1.13
  alias-chains `Issue#reload` (`reload_with_tag_list`), ifv prepends `reload`; together `SystemStackError`
  on the first `issue.reload` (the seed did not get through). The case of Jan's rule; for redmine_tags
  (the gem, so a prepend wrapper or a gem fix is needed). The server runs above are without redmineup_tags;
  the test run is with it (43 plugins plus theme_changer).
- redmine_view_issue_description refuses issue pages to the core Reporter role: by design (known).

## Inventory of functions

| function | how a user reaches it | scenario | screenshot |
|---|---|---|---|
| Theme selector (blank + installed themes) | My account > Preferences > Theme (hook `view_my_account_preferences`) | user_theme step 1 | user-theme-selector-default.png |
| Save a personal theme | My account > Save (PUT /my/account) | steps 2, 3 | user-theme-chosen-red.png, user-theme-issues-red.png |
| Personal stylesheet, body class and icon sprite (`current_theme`, `body_css_classes`) | every page | steps 2, 3 | user-theme-issues-blue-icons.png |
| Isolation between users, any logged in user may choose, blank clears | other users | step 4 | user-theme-other-user-unaffected.png, user-theme-reporter-chooses.png, user-theme-reporter-cleared.png |
| Global theme as fallback, personal choice wins | Administration > Settings > Display | step 5 | user-theme-global-theme.png, user-theme-personal-wins.png |
| Invalid, forged or array values ignored | PUT /my/account | step 6 | user-theme-invalid-ignored.png |
| REST API | PUT /my/account.json | step 7 | user-theme-api-change.png |
| Anonymous: global theme, /my/account needs login | login page | step 8 | user-theme-anonymous-global.png |
| **Conversion to theme_changer** (q1): dry run, run, idempotent rerun, THEME_MAP, skip uninstalled, replace `__system_setting__`, keep a theme_changer choice, revert | `rake redmine_user_specific_theme:convert_to_theme_changer` / `revert_theme_changer_conversion` (shell on the server; no web route, no permission involved) | user_theme_to_theme_changer (rake output in the run log) | theme-conversion-both-selectors.png, -manager-converted.png, -reporter-converted.png, -outsider-mapped.png, -admin-no-choice.png, -reverted.png |
| Converted choices in effect after removing this plugin, as manager, reporter, outsider (Opale) and admin (no choice) | every page | e2e-after-removal/theme_changer 0, 1 | theme-changer-plugins.png, -manager-blue.png, -reporter-red.png, -outsider-opale.png |
| theme_changer functions: user picks a theme, "Default", "Use system setting", admin default, personal over global, REST API, anonymous | My account > Information > Theme; Administration > Settings > Display | e2e-after-removal/theme_changer 2, 3, 4, 5 | theme-changer-admin-default.png, -personal-wins.png, -reporter-picks.png, -reporter-default.png, -reporter-system.png, -api-change.png, -anonymous-global.png |
| Refusals and failure paths (q1) | private project as outsider, anonymous My account, forged `pref[theme]`, user creation via API with `pref.theme` | user_theme_to_theme_changer, e2e-after-removal/theme_changer 4 | theme-conversion-outsider-private-refused.png, theme-changer-outsider-private-refused.png, theme-changer-forged-value.png (finding 1), API 422 (finding 2, no page) |
| **Opale** as global theme (q2): main pages, refusals, mobile | every page | e2e-after-removal/opale | opale-projects.png, -admin.png, -admin-settings.png, -issues.png, -issue.png, -issue-edit.png, -wiki.png, -my-page.png, -my-account.png, -project-settings.png, -issue-reporter.png, -reporter-settings-refused.png, -outsider-projects.png, -outsider-private-refused.png, -login.png, opale-mobile-issues.png, -issue.png, -menu-open.png, -my-page.png |
| Core pages with all GEOxyz plugins | Project > Settings, issue list, issue page, My account | core_pages | core-pages-*.png (10), geoxyz-all/core-pages-*.png |

The plugin has no permissions, menus, settings, routes, macros, mail or migrations; since 2026-10-07 it has two rake tasks (the conversion). `admin`, `manager`, `reporter` are all exercised (any logged in user may choose a theme); `outsider` has no extra path here. Not in scope: themes themselves (see below).

## Decided by Jan (2026-10-07)

Recorded from docs/DECISIONS-2026-10-07.md (Jan Catrysse, 2026-10-07, coordinating session
https://claude.ai/code/session_01GiSsYPm3bxvqrpZkdCxNoi). Final; do not reopen.

General, for every GEOxyz plugin:
- Straight to Redmine 7, no backports to 5.1; `redmine70-migration` is what goes live. Redmine 5.1
  compatibility is no longer a requirement.
- PostgreSQL 16 only (production). Tests and e2e on PostgreSQL; MariaDB runs are no longer required,
  a MariaDB-only problem is a note here, not a blocker.
- Deface without a version constraint: n.v.t., this plugin has no Gemfile and no deface.
- A core method other plugins also patch is patched with `prepend`, never `alias_method`: this
  plugin already uses `prepend` only (`MyController`, `ApplicationHelper`); checked, nothing to change.
- GitHub Actions stay manual only (`workflow_dispatch`).

For this plugin:
1. **q1, keep redmine_user_specific_theme or switch to redmine_theme_changer?** Decided 2026-10-07:
   **B, "Overstappen op redmine_theme_changer"** (Een onderhouden plugin, maar de themakeuze van alle
   gebruikers moet omgezet worden, en hoe die plugin de keuze bewaart is niet nagekeken.). This repo
   carries the conversion (rake task) and the production steps; redmine_user_specific_theme is
   removed from production after the conversion. See "Switch to redmine_theme_changer".
2. **q2, update PurpleMine2 for Redmine 7 or replace it by Opale?** Decided 2026-10-07:
   **B, "Vervangen door Opale (gagnieray/opale)"** (Een onderhouden opvolger die Redmine 5, 6 en 7
   claimt; hij moet nog op Redmine 7 getest worden.). See "Opale on Redmine 7".
3. Which remote/commit runs on the server (expected siberianlove 0f261fe): still needs the server;
   it no longer matters for the code, since the plugin is removed after the conversion.

## Switch to redmine_theme_changer (decision q1, 2026-10-07)

**How each plugin stores the per-user theme** (read in the code, measured on Redmine 7.0.1):

| | redmine_user_specific_theme 1.3.0 (this repo) | redmine_theme_changer 0.7.1 (haru, 2025-12-24) |
|---|---|---|
| storage | `user_preferences.others[:ui_theme]` (YAML hash in the existing column) | own table `theme_changer_user_settings` (`id`, `user_id`, `theme`, `updated_at`), migration `0001`, one row per user |
| value | theme id (directory name) or nil | theme id, `__system_setting__` (follow the global theme) or `__default_theme__` (Redmine's own look, no theme) |
| no choice | nil: global theme | no row, or `__system_setting__`: global theme |
| theme not installed | falls back on the global theme | `Redmine::Themes.theme` gives nil: **no theme at all** (core look), not the global theme |
| selector | My account > Preferences > Theme, `pref[ui_theme]` (hook `view_my_account_preferences`) | My account > Information > Theme, `pref[theme]` (hook `view_my_account`); `UserPreference#theme=` and `safe_attributes 'theme'` |
| input check | only installed themes are stored | any string is stored |
| patches | `prepend` on `MyController#account`, `ApplicationHelper#current_theme`, `#body_css_classes` | `prepend` on `ApplicationHelper#body_css_classes` and `UserPreference#theme(=)`; `current_theme` defined in `ApplicationHelper` through `include` + `class_eval` |

Both use `prepend` for the shared methods (Jan's rule, 2026-10-07); with both installed this
plugin's `current_theme` wins (it is prepended later, in `after_initialize`).

**The conversion** (this repo, `56a5bef`): `rake redmine_user_specific_theme:convert_to_theme_changer`
copies every user's choice into theme_changer:
- installed theme: a row with that theme id (`created`);
- `THEME_MAP=old:new,...` replaces a theme on the way (`THEME_MAP=purplemine2:opale`, decision q2);
- theme not installed (after the map): **skipped and listed**, no row, so the user keeps following the
  global theme as before (a row would leave the user without any theme);
- a row with `__system_setting__` is replaced (`updated`): theme_changer's form saves that value for
  every user who saves My account while both plugins are installed (measured, e2e step 2);
- a row with another theme is kept (`kept`): the user already chose in theme_changer;
- the same theme already there: `unchanged`. The source (`others[:ui_theme]`) is never changed, so a
  second run changes nothing (idempotent).
`rake redmine_user_specific_theme:revert_theme_changer_conversion` (same `THEME_MAP`) removes exactly
the rows whose theme equals what the conversion would write; a row the user changed afterwards is kept.
`DRY_RUN=1` runs either task in a transaction that is rolled back, with the same report.
Tests: `test/unit/redmine_user_specific_theme/theme_changer_conversion_test.rb`, 12 tests on PostgreSQL
(the file fails to load without the code; the `__system_setting__` test fails on the code without that branch).

**theme_changer 0.7.1 on Redmine 7.0-stable-GEOxyz**: its own tests 8 runs, 23 assertions, 0 failures,
0 errors (PostgreSQL; its test_helper needs the `simplecov-lcov` gem, added through `Gemfile.local`).
e2e with this plugin removed (`test/e2e-after-removal/theme_changer.mjs`): converted choices in effect
(stylesheet, body class `theme-E2e_blue`, the theme's icon sprite: 26 of 28 `<use>`), a user picks a
theme, "Default", "Use system setting", the admin default (global theme) for a user without a choice,
the personal choice over the global theme, REST API `PUT /my/account.json` with `pref.theme`, anonymous.

**Findings in redmine_theme_changer 0.7.1** (not fixed: not our repository, no fork, Jan 2026-10-07):
1. Any `pref[theme]` value is stored; a forged or stale value (`nosuchtheme`) leaves the user without a
   theme (core look, not the global theme). Cosmetic, the value only goes to `Redmine::Themes.theme`.
   e2e: theme-changer-forged-value.png. The conversion avoids writing such values.
2. Creating a user through the REST API with `pref.theme` fails: `UserPreference#theme=` saves a row
   before the user has an id, `validates_presence_of :user` raises, the API answers **422** and the user
   is not created (without `pref.theme`: 201). Also `theme=` saves immediately, before the user or
   preference itself is validated. The admin form does not send `pref[theme]`, so only the API is hit.
3. A theme that is removed from `themes/` leaves its users without a theme (see 1), unlike this plugin.
   Before removing a theme in production, move its users (SQL below or the UI).
4. While both plugins are installed, My account shows two "Theme" selectors (ours under Preferences,
   theirs under Information), and saving the form stores `__system_setting__` for theme_changer.
   Keep the overlap to the maintenance window (steps under "After the upgrade").

## Opale on Redmine 7 (decision q2, 2026-10-07)

Opale 1.7.2 (release zip `opale-1.7.2.zip`: `stylesheets/application.css` and `webfonts/tabler-icons.*`,
no `images/icons.svg`, so Redmine's own SVG sprite is used and restyled) in `themes/opale`, set as the
global theme, Redmine 7.0-stable-GEOxyz in production mode, PostgreSQL. `test/e2e-after-removal/opale.mjs`:
19 screenshots (15 desktop: project list, admin, Settings > Display, issue list, issue page, edit form,
wiki, My page, My account, project settings, reporter issue page, reporter refused, outsider project list,
outsider refused, login; 4 at 390 px: issue list, issue page, flyout menu, My page). No asset errors
(no 404 on fonts or images, no JS errors); the icon font reports `loaded`. Same result with all GEOxyz
plugins installed (`docs/e2e/geoxyz-all/`).

Visual findings (all cosmetic; none blocks the switch):
1. Issue page: the reaction button (thumbs up) sits under the "Next »" of the issue navigation
   (opale-issue.png). Compared with the default theme on 2026-10-07: core does the same, so not an
   Opale point.
2. The sidebar collapse button (`«`, Redmine 6.1+) is a small square on the edge of the content area,
   overlapping the sidebar border (every page with a sidebar).
3. 390 px: in the journal header the avatar overlaps the wrapped "minutes ago" text; long subjects in
   the issue list and in My page blocks are clipped at the right edge instead of scrolling
   (opale-mobile-issue.png, opale-mobile-issues.png, opale-mobile-my-page.png).
4. Full-page screenshot of the edit form shows the sticky issue header strip at its scroll position
   (opale-issue-edit.png); probably the screenshot, not the theme. To check by hand.
Jan decided to report them ("Wel melden", round 3, 2026-10-07): ready-to-post issue in
`docs/opale-upstream-issue.md` (points 2 and 3, plus the overflowing done-ratio bars under Subtasks and
Related issues at 390 px), with default-theme comparison screenshots in `docs/e2e/opale-upstream/`.
Jan posts it himself; nothing to change in Redmine.
Not done: PurpleMine2 on 7.0 for a before/after comparison (Jan replaces it).

## Work list for the migration session

In this order: things that break, security, the GEOxyz changes, the open items, then the checks.

**Priority items**

1. DONE: repair or replace the 6 stale tests (they use a `ui_theme` attribute that UserPreference no longer has; the code itself stores the choice in pref.others[:ui_theme]).

**Open items from the analysis** (Dutch; where they conflict with a decision or a priority item above, those win)

2. NOT NEEDED (the plugin is removed after the conversion, decision q1): op de server bevestigen welke remote/commit draait (verwacht siberianlove 0f261fe)
3. DONE (fork exists; Jan decided q1 = switch to redmine_theme_changer, 2026-10-07): Jan: die repo forken naar jcatrysse zodat een harness-run en redmine70-migration mogelijk zijn, of overstappen op redmine_theme_changer 0.7.1 met datamigratie
4. DONE (the sprite follows the user theme, e2e step 3): op 7.0 testen of de iconensprite het gebruikersthema volgt (IconsHelper#sprite_source gebruikt current_theme, nieuw in 6/7)
5. PRODUCTION STEP (see After the upgrade, Themes): thema's verplaatsen van public/themes naar themes/ (7.0 scant public/themes niet meer) en elk thema testen op header/gebruikersmenu/SVG-iconen
6. DONE (q2 = replace by Opale, 2026-10-07; see "Opale on Redmine 7"): PurpleMine2 (Jans fork) is een thema-risico: upstream stil sinds 2023-11 en verwijst naar de onderhouden fork gagnieray/opale (claimt 5.x/6.x/7.x)

**Decisions of 2026-10-07**

10. DONE (q1): conversion to redmine_theme_changer, rake tasks with tests (`56a5bef`), e2e (`8b81845`),
    production steps under "After the upgrade". Removing the plugin from production is a production step.
11. DONE (q2): Opale 1.7.2 tested on Redmine 7 (`5dcd50a`), findings under "Opale on Redmine 7",
    production steps under "After the upgrade". Fixing the cosmetic findings is for Opale upstream.
12. DONE (general): no 5.1, PostgreSQL only, prepend rule (nothing to change here), combination run.
13. OPEN (Jan / redmine_tags owner): redmineup gem `alias_method` on `Issue#reload` vs ifv `prepend`
    (combination finding above). Not this plugin.

**Checks**

7. DONE: run the plugin's whole test suite on Redmine 7.0-stable-GEOxyz with PostgreSQL (and MariaDB, 2026-10-06; no longer required). 5.1: dropped (Jan, 2026-10-07).
8. DONE (nothing needed): check Redmine 7 webhooks against this plugin (see "Rules"), and note the result here even if nothing is needed.
9. DONE: verify every feature of the plugin by hand on a running Redmine 7 (screenshots).

## GEOxyz changes to review or re-apply

None: this branch carries no GEOxyz commits of its own (upstream code only).

## After the upgrade (production)

Actions the person doing the upgrade must take, or know about, for this plugin:

**Themes (decision q2 and the analysis)**
1. On the 5.1 server: `ls public/themes` and note every theme, and which ones users chose:
   `SELECT u.login, p.others FROM user_preferences p JOIN users u ON u.id = p.user_id WHERE p.others LIKE '%ui_theme%';`
   and the global one: `SELECT value FROM settings WHERE name = 'ui_theme';`.
2. Redmine 7 scans only `themes/` and `app/assets/themes/` (classic, alternate). Move every theme you keep
   from `public/themes/<id>` to `themes/<id>` **before the first boot** (themes are registered as asset paths
   at boot); keep the directory name, it is the theme id stored per user. Each needs `stylesheets/application.css`.
3. Opale: download `https://github.com/gagnieray/opale/releases/download/1.7.2/opale-1.7.2.zip`, unpack,
   rename `opale-1.7.2` to `themes/opale`. Do not copy PurpleMine2 to `themes/`.
4. `bundle exec rake assets:precompile RAILS_ENV=production` (or `assets:clobber` first if a theme looks
   unstyled), restart.
5. Test every remaining theme on 7.0 as a user who chose it: header and user menu (new `<nav>`, `#account`
   dropdown), SVG icons (`icon-*` CSS backgrounds no longer work; a theme may ship `images/icons.svg`),
   issue list, issue page, My page, admin, mobile width. Measured: the per-user theme also drives the icon
   sprite on Redmine 7. A theme that is not fixed is removed; move its users first (step 4 of the next list).
6. If the global theme was PurpleMine2: Administration > Settings > Display > Theme = Opale.

**Switch to redmine_theme_changer (decision q1)**, in the maintenance window, before users log in:
1. Install the plugin: `git clone https://github.com/haru/redmine_theme_changer plugins/redmine_theme_changer`,
   `git -C plugins/redmine_theme_changer checkout 0.7.1`; keep `plugins/redmine_user_specific_theme`
   (branch `redmine70-migration`) installed for now. `bundle exec rake redmine:plugins:migrate RAILS_ENV=production`.
2. Dry run: `bundle exec rake redmine_user_specific_theme:convert_to_theme_changer THEME_MAP=purplemine2:opale DRY_RUN=1 RAILS_ENV=production`.
   Use the theme id exactly as stored (the directory name from step 1 of the theme list; e.g.
   `THEME_MAP=PurpleMine2:opale` when the directory was called `PurpleMine2`). Read the `skipped:` lines:
   each names a theme that is not in `themes/`; add it to `THEME_MAP` or accept that those users follow
   the global theme.
3. Run it without `DRY_RUN`. Run it a second time: it must report only `unchanged` (and the same `skipped`).
4. Check: `SELECT u.login, t.theme FROM theme_changer_user_settings t JOIN users u ON u.id = t.user_id ORDER BY 1;`
   against step 1, and log in as one user with a personal theme. Undo if needed:
   `bundle exec rake redmine_user_specific_theme:revert_theme_changer_conversion THEME_MAP=purplemine2:opale RAILS_ENV=production`.
5. Remove redmine_user_specific_theme: `rm -rf plugins/redmine_user_specific_theme` (no migrations, nothing to
   roll back; the rake tasks, revert included, leave with it), restart. The old values stay in `user_preferences.others[:ui_theme]`, harmless; they keep the
   conversion repeatable until you are satisfied.
6. Afterwards: users choose under My account > Information > Theme. A theme removed later leaves its users
   without a theme (finding 3): move them first with
   `UPDATE theme_changer_user_settings SET theme = '__system_setting__' WHERE theme = '<old id>';`.

## How to test

```sh
./.codex/redmine_clone.sh 7.0-stable-GEOxyz      # or 5.1-stable / 6.1-stable / 7.0-stable
./.codex/test_setup.sh                                 # RMP_DB=mariadb for MariaDB, RMP_PROVISION_DB=0 if a server runs
./.codex/test_plugin.sh                                # minitest + rspec of this plugin
```

```sh
./.codex/start_server.sh       # real Redmine (production mode) with this plugin, seeded users and projects
./.codex/e2e.sh                # browser: smoke over the plugin's pages, core issue flows, test/e2e/*.mjs
./.codex/openai_review.sh      # independent OpenAI review of the diff, only when OPENAI_API_KEY is set
```
Write one scenario per function in `test/e2e/<function>.mjs` (example at the top of
`.codex/e2e/lib.mjs`); screenshots and a table per scenario land in `docs/e2e/`. Users:
`admin`, `manager` (every permission), `reporter` (no plugin permissions), `outsider` (no
membership); password `Redmine7Test!`. Needs Node with Playwright and Chromium
(`npm install -g playwright && npx playwright install --with-deps chromium`).

For the theme migration (decisions of 2026-10-07): put redmine_theme_changer 0.7.1 in
`redmine/plugins/` (`git clone https://github.com/haru/redmine_theme_changer` and `checkout 0.7.1`;
its own tests also need `gem 'simplecov-lcov'` in `redmine/Gemfile.local`) and Opale in
`redmine/themes/opale` before `start_server.sh`; `e2e.sh` then also runs the conversion scenario.
The state after removal: `./.codex/start_server.sh --stop`, move `redmine/plugins/redmine_user_specific_theme`
out, start `bin/rails server -e production -p 3000` in `redmine/`, then
`REDMINE_DIR=$PWD/redmine RMP_E2E_OUT=docs/e2e node test/e2e-after-removal/theme_changer.mjs` and
`.../opale.mjs`, and put the plugin back. As root, `test_setup.sh` cannot provision PostgreSQL
(`$SUDO -u postgres` with an empty `$SUDO`): create the role by hand and use `RMP_PROVISION_DB=0`.

On GitHub the same runs by hand only: Actions > "Redmine tests (manual)" > Run workflow (tick
"e2e" for the browser run; screenshots come back as an artifact).

The coordinator's harness (`plugin-check.sh` in the migration kit, kept outside this repo) adds a
browser smoke test of every page the plugin adds and runs all GEOxyz plugins together; the
results quoted in the analysis come from it.

## How the migration session works (same for every plugin)

1. **Start**: `git fetch && git checkout redmine70-migration && git pull`. Read this whole file,
   including the analysis report at the bottom. Do not reopen decisions recorded here.
2. **Baseline, before you change anything**:
   - the plugin's tests on Redmine 7.0-stable-GEOxyz with PostgreSQL;
   - a real running Redmine with this plugin (`./.codex/start_server.sh`) and the browser run
     (`./.codex/e2e.sh`: smoke over every page the plugin adds, plus the core issue flows).
   Write the numbers here. Something already broken now is a finding, not your regression.
3. **Inventory of functions**: list every function of the plugin in this file, in a table
   "function | how a user reaches it | scenario | screenshot". Take them from the README,
   `init.rb` (permissions, menus, settings, project modules), routes, hooks and view
   overrides, macros, mail handling, API endpoints, rake tasks and cron jobs. This table is the
   coverage list for step 8; a function that is not in it will not be tested.
4. **GEOxyz changes**: go through the table above, one item at a time. Each kept or re-made change
   is its own commit with a test that proves it. Record the verdict in the table.
5. **Work list**: then the numbered list, in order. One concern per commit.
6. **Portability**: PostgreSQL 16 is the target (Jan, 2026-10-07); keep SQL portable where that
   costs nothing. Migrations must be reversible and are run down and up on PostgreSQL.
7. **Together**: run with the other GEOxyz plugins installed (the migration kit's harness, or
   `RMP_EXTRA_PLUGINS`). A failure that only appears in combination is a finding to record here.
8. **End to end, visually, every function**: on the real Redmine from `start_server.sh`
   (production mode, the way GEOxyz runs it), write one scenario per function in
   `test/e2e/<function>.mjs` with `.codex/e2e/lib.mjs` and run them with `./.codex/e2e.sh`.
   - Each function as the users that matter: `admin`, `manager` (every permission, the
     plugin's included), `reporter` (member without the plugin's permissions), `outsider`
     (no membership, private project must stay invisible).
   - The failure paths too: setting off, permission absent, empty state, invalid input, the
     value that used to raise. A refusal that is shown is evidence as much as a success.
   - One screenshot per function and per path, with a caption saying what it proves. Open
     every screenshot and look at it: a picture nobody looked at proves nothing. Commit them
     in `docs/e2e/` and list them in the inventory table.
   - Functions without a page (mail in and out, REST API, rake tasks, cron, webhooks): exercise
     them against the same running instance (mails land in `redmine/tmp/mails`, `t.mails()`
     reads them; API through `t.page.request`) and record command and result.
   - Before pictures where behaviour or layout changes: optional; the 5.1 server is no longer a
     reference (Jan, 2026-10-07).
9. **Independent review**: first your own, adversarial: re-read the whole diff as if someone
   else wrote it and you are paid to reject it. Then, **when `OPENAI_API_KEY` is set in the
   session**, `./.codex/openai_review.sh`: it sends the diff of this branch to an OpenAI model
   and writes `docs/reviews/openai-<date>-<sha>.md`. Every finding gets a `Resolution:` line
   there (fixed in <commit>, with a test, or why not). Fix, re-run the tests and the e2e set,
   and run the review again until it has nothing new that you accept. Without the key: write
   "OpenAI review: skipped, no OPENAI_API_KEY" in the report; never send code anywhere else.
10. **After the upgrade**: anything the production upgrade must do for this plugin (data fixes,
    settings, cron, files, removed features) goes into the section "After the upgrade".
11. **Finish**: update "Status", the inventory and the work list in this file, push
    `redmine70-migration`, and report: what changed, test numbers on both databases, e2e
    numbers (scenarios, screenshots, problems), the review result, what is left, what needs Jan.

### Stop and ask Jan when
- a GEOxyz change would be lost or behave differently for users;
- a new gem, a new setting with user impact, or a schema change not required by Redmine 7 seems needed;
- the change would send data to an external service (the OpenAI review of the code diff is the
  one exception Jan approved, and only when the key is present);
- upstream and GEOxyz disagree on behaviour and both are defensible.

## Rules

- **Target**: Redmine 7.0-stable-GEOxyz (https://github.com/jcatrysse/redmine), Rails 8.1, Ruby 3.3+.
  Core sources for comparison: branches `5.1-stable`, `6.1-stable`, `7.0-stable`, `7.0-stable-GEOxyz`.
- **Evidence**: never report a test, lint, browser check or review as passed without having seen
  it. Quote the summary lines; list the screenshots. "Should work" is not a result, and a green
  test suite is not proof that a feature works in the browser.
- **Tests**: never skip, delete or weaken a test. A test that encodes Redmine 5 markup or
  behaviour is updated to Redmine 7, with the reason in the commit. Every fix gets a test that
  fails without it.
- **Minimal diffs** in the plugin's own style. No reformatting, no unrelated refactoring.
  Something wrong elsewhere: write it down here, do not fix it in passing.
- **Security**: authorization on every action and entry point; `safe_attributes`, never
  `to_unsafe_hash` into `update`; no SQL built from params; no secrets in logs; no `html_safe` on
  user input.
- **Webhooks (new in Redmine 7)**: core sends issue payloads (core `issues/show.api.rsb`, rendered
  as the webhook owner) to webhook endpoints, past plugin hooks and controller patches. If the
  plugin hides, adds or changes issue data, make webhooks consistent with that or record why not.
- **Redmine 7 conventions**: SVG icons through `sprite_icon` (the `icon icon-*` CSS is gone),
  Propshaft assets under `assets/` (`/assets/plugin_assets/<id>/...`), the new header and user menu,
  `ContextMenus::*Controller`, Loofah-based text formatting, Chart.js as an ES module, sudo mode
  (on by default: `t.sudo()` in a scenario). The breaker list is in the migration kit's CHECKLIST.md.
- **Locales**: keep the locales the plugin ships in sync; translate a new key by matching the
  closest existing key in the same file, not from scratch; do not add new languages.
- **No 5.1** (Jan, 2026-10-07): GEOxyz goes straight to Redmine 7; no backports, no code paths
  that exist only for 5.1.
- **PostgreSQL only** (Jan, 2026-10-07): production runs PostgreSQL 16; tests and e2e run on
  PostgreSQL. Keep SQL portable where that costs nothing; a MariaDB-only problem is a note here.
- **Core patches**: a core method other plugins also patch is patched with `prepend`, never with
  `alias_method` (Jan, 2026-10-07).
- **Git**: work on `redmine70-migration` only; never push to the default branch; never force-push
  a branch someone else uses. Descriptive commit messages (what and why). Push after every
  commit, together with the updated status in this file: a cloud session can stop at a usage
  limit, and work that is not pushed is lost with its container.
- **GitHub Actions**: manual only (`workflow_dispatch`). Do not add push, pull_request or schedule
  triggers.

## Definition of done

- All items of the work list are done or explicitly deferred with a reason, in this file.
- The plugin's tests are green on Redmine 7.0-stable-GEOxyz with PostgreSQL
  (numbers in this file); boot, production-like eager load, migrations up/down OK.
- Every function in the inventory exercised end to end on a real running Redmine, with and
  without permissions and on its failure paths; `./.codex/e2e.sh` green; screenshots looked at,
  committed in `docs/e2e/` and listed.
- Review done: your own, and the OpenAI review when the key is present, every finding resolved
  in `docs/reviews/`.
- No new failure when run together with the other GEOxyz plugins.
- "After the upgrade" lists every action production needs; "Status" is current.


## Analysis report (2026-10-06, Dutch)

# redmine_user_specific_theme
- Gebruikte branch: "compatible-with-redmine-5" volgens Jan, zonder fork. Die exacte naam bestaat nergens in het fork-netwerk (24 forks nagelopen). De bijna-identieke `compatibility-with-redmine-5` van **siberianlove/redmine_user_specific_theme** @ `0f261fe` (2024-03-11) is vrijwel zeker wat GEOxyz draait - plugin id `redmine_user_specific_theme`, versie 1.3.0. Bevestigen op de server met `git -C plugins/redmine_user_specific_theme remote -v; git -C plugins/redmine_user_specific_theme log -1`.
- Upstream: Undev/redmine_user_specific_theme, nu doorgestuurd naar Restream/redmine_user_specific_theme - upstream HEAD master @ `9e3cdc3` (2017-07-06). Dood: redmine.org vermeldt alleen 0.0.1 (2013) voor Redmine 2.1-2.5.
- Fork t.o.v. upstream: siberianlove-branch = upstream master + 1 commit `0f261fe48e0aa91fbfeaee81a7efc97a7133a07d` "compatibility with redmine 5" (6 bestanden). GEOxyz heeft geen eigen commits (geen fork).
- Andere relevante branches: evolvingweb/redmine_user_specific_theme `redmine-5-compatibility` @ `4c9a3fc` (2023-04-05, "Autoloder fix with to_prepare", bovenop kporras07 `support-redmine-4`); earth763 `5.0` (2024-02-05); t-gergely `redmine4.1`. Geen enkele fork claimt Redmine 6 of 7.

## 1. Werkt out of the box op Redmine 7?   niet getest (geen fork)
Geen harness-run mogelijk: de code zit niet in Jans fork-netwerk. Statische analyse van de siberianlove-branch (bestanden via raw.githubusercontent.com gelezen), vergeleken met core `origin/5.1-stable` en `origin/7.0-stable`:
- `init.rb`: `requires_redmine version_or_higher: '4.0.0'` en vier `require_relative`'s van bestanden onder `lib/`. Plugin-lib zit in 5.1 én 7.0 op het Zeitwerk-autoloadpad (`PluginLoader.add_autoload_paths`) en init.rb draait in beide in `to_prepare`. Hetzelfde mechanisme als op 5.1, dus waarschijnlijk geen nieuwe fout. Niet geverifieerd, ook niet met eager load.
- `lib/redmine_user_specific_theme.rb`: `MyController.prepend` direct bij het laden, en `ApplicationHelper.prepend` in `config.after_initialize`. `MyController#account` bestaat in 7.0 met dezelfde vorm (`@user.pref.safe_attributes = params[:pref]`), dus de patch blijft passen.
- `ApplicationHelperPatch#current_theme` roept `super` aan, gooit het resultaat weg en geeft het thema uit `User.current.pref.others[:ui_theme]` terug, met `Setting.ui_theme` als terugval. In 7.0 staat `current_theme` nog in `Redmine::Themes::Helper`, dat in `ApplicationHelper` geïncludeerd is. **Nieuw in 7.0:** ook `IconsHelper` includeert `Redmine::Themes::Helper` en gebruikt `current_theme` om de SVG-iconensprite van het thema te kiezen (`icons_helper.rb:29`, `sprite_source`). Of de prepend op `ApplicationHelper` ook die iconen per gebruiker omzet, hangt af van de volgorde van de helpermodules. **Niet geverifieerd.** Het mogelijke symptoom: stylesheet van het gebruikersthema, iconen van het globale thema.
- `body_css_classes`-patch: werkt nog. Core 7.0 maakt `theme-<naam met _ voor spaties>`, de patch `theme-<naam>` zonder die vervanging. Alleen relevant voor themanamen met een spatie.
- De hook `view_my_account_preferences` bestaat in 7.0 (`app/views/my/account.html.erb:73`). De partial gebruikt alleen `label_tag`/`select_tag`.
- Geen migraties, geen Gemfile, geen JS of assets.

## 2. Upstream sync?   UPSTREAM DOOD
Restream-master staat stil sinds 2017. Er is geen fork met Redmine 6- of 7-werk. Er valt niets te syncen.
**Onderhouden alternatief:** `haru/redmine_theme_changer` 0.7.1 (2025-12-24) claimt op redmine.org compatibiliteit met 7.0.x, 6.1, 6.0 en 5.1. 0.7.1 "Fix body element theme class not updating when user changes theme". Overstappen kost een datamigratie van de per-gebruiker-keuze: die staat nu in `user_preferences.others[:ui_theme]` (YAML). Dat theme_changer een eigen opslag heeft, is niet geverifieerd.

## 3. Werkt na sync op Redmine 7?   n.v.t.

## 4. Complexiteit en blokkers   score 2 (plugin) / 4 (de thema's zelf)
- Blokkers: geen bevestigde (geen run). Hoogste plugin-risico: de iconensprite volgt mogelijk niet het gebruikersthema (zie §1).
- **Stille breuken: de thema's die je via deze plugin aanbiedt.** Dat weegt zwaarder dan de plugin:
  - Locatie: 7.0 zoekt thema's in `themes/*` en `app/assets/themes/*`, **niet meer in `public/themes`** (`lib/redmine/themes.rb`, `scan_themes`). Elk thema heeft `stylesheets/application.css` nodig en wordt bij het opstarten als Propshaft-assetpad geregistreerd (`config/initializers/30-redmine.rb:105`). Thema's moeten dus vóór de boot op hun plek staan. Een thema dat ontbreekt, valt voor die gebruiker stil terug op het globale thema.
  - Iconen (6.0, #43206): CSS-iconen `icon-*` met PNG-achtergrond doen niets meer; core tekent SVG via `sprite_icon`. Een thema kan een eigen `images/icons.svg`-sprite meeleveren. Core heeft `legacy-icons-compat.css` voor wie de oude iconen terug wil.
  - Header en gebruikersmenu (7.0, #43937, #31353): `#top-menu` is een `<nav>` met `.general-menu`/`.profile-menu`, `#loggedas` is weg en `#account` is een dropdown. Thema-CSS die daarop stijlt, breekt visueel.
  - **PurpleMine2:** upstream `mrliptontea/PurpleMine2` kreeg zijn laatste functionele commit op 2023-11-20 ("Fix calendar display with Redmine 5.1"). De README verwijst nu zelf door naar de onderhouden fork **`gagnieray/opale`** ("For a maintained Redmine 6.x fork, see Opale"). Die claimt "Redmine 5.x, 6.x & 7.x" (v1.7.2). Jans fork `jcatrysse/PurpleMine2` bestaat; die viel buiten deze opdracht en is niet onderzocht. Verwacht dat PurpleMine2 op 7.0 zichtbaar breekt (header, iconen) tot hij is bijgewerkt of door Opale vervangen.
- Overlap met Redmine 7 core: geen. 7.0 kent alleen het globale `ui_theme` (plus per gebruiker het lettertype van tekstvakken), geen thema per gebruiker.
- Open werk voor ansif:
  1. Bevestig op de 5.1-server welke remote/commit in `plugins/redmine_user_specific_theme` staat (verwacht: siberianlove `0f261fe`).
  2. Laat Jan die repo forken naar `jcatrysse/redmine_user_specific_theme`. Dan kan een volgende sessie hem door de harness halen en een `redmine70-migration`-branch maken. Of beslis om over te stappen op `redmine_theme_changer` 0.7.1, met een migratie van `others[:ui_theme]`.
  3. Inventariseer de aangeboden thema's (`ls public/themes` op 5.1) en verplaats ze naar `themes/`. Test elk thema op 7.0: header, gebruikersmenu, iconen, issue-pagina.
  4. PurpleMine2-fork van Jan: bijwerken voor 6/7, of vervangen door `gagnieray/opale`. Dit is een aparte taak.
  5. Test op 7.0 met een gebruiker die een ander thema heeft dan het globale, of stylesheet én iconensprite allebei van het gebruikersthema komen.

## Branch redmine70-migration
- Basis: n.v.t. (geen fork)
- Commits: geen
- Eindresultaat harness: niet gedraaid
- Rollback migraties: n.v.t. (plugin heeft geen migraties)


## Aanvulling coordinator (2026-10-06, na het forken)
Jan forkte `jcatrysse/redmine_user_specific_theme` (fork van siberianlove; de branch heet `compatibility-with-redmine-5`). `redmine70-migration` = die branch (0f261fe), zonder wijzigingen.
Gemeten met de harness (PostgreSQL): boot 1.3.0, eager load, smoke 60/60. **minitest 6 runs, 6 errors**: de tests zijn verouderd (ze verwachten een `ui_theme`-attribuut op UserPreference, de code bewaart de keuze in `pref.others[:ui_theme]`); geen Redmine 7-oorzaak.
Live getest met een eigen testthema `alpha` (met eigen `images/icons.svg`) in `themes/`, globaal thema leeg, admin met voorkeur alpha:
- stylesheet `/assets/themes/alpha/application-*.css` geladen, headerkleur van het thema;
- iconen: 31 van de 33 `<use>` op de issuelijst komen uit `/assets/themes/alpha/icons-*.svg`; de rest is een lege JS-sjabloon en één filterknop. Het gebruikersthema stuurt dus ook de iconensprite (de vrees uit de eerste analyse klopt niet);
- in "Mijn account" toont de keuzelijst de thema's, kiezen en opslaan werkt (others[:ui_theme] = classic, daarna classic-stylesheet).
Conclusie: de plugin werkt op 7.0; de thema's moeten naar `themes/` en de tests moeten worden herschreven.

