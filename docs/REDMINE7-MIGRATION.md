# Redmine 7 migration: redmine_user_specific_theme

Start a Claude Code (or Codex) session on this repository, branch `redmine70-migration`, with:

> Read CLAUDE.md and docs/REDMINE7-MIGRATION.md, then carry out the Redmine 7 migration of this
> plugin as described there, on branch redmine70-migration. That includes the plugin's tests on
> PostgreSQL and MariaDB, every function exercised end to end on a real running Redmine in a
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
| Runs on Redmine 7 as is | JA (tests were stale, fixed; see "Result of the migration session") |
| Upstream sync | UPSTREAM DOOD: niets; onderhouden alternatief haru/redmine_theme_changer 0.7.1 (claimt 7.0) vraagt een migratie van user_preferences.others[:ui_theme] |
| After sync | n.v.t. |
| Complexity (1 trivial .. 5 rewrite) | 2 |
| Measured on | Redmine 7.0.1 (7.0-stable-GEOxyz + latest 7.0-stable), Rails 8.1.3.1, Ruby 3.3.6, PostgreSQL 16 and MariaDB 10.11 |
| Branch head when this file was written | `130f59f` |

## Already on this branch

- Stale tests rewritten for `pref.others[:ui_theme]` with throw-away themes in `themes/` (6 -> 20 tests).
- Account patch stores only an installed theme id (blank clears, anything else is ignored and keeps the current choice).
- Body class: `theme-<name with _ for spaces>` like core 7.0, and added when the global theme is blank (core adds it only for the global theme).
- e2e scenario `test/e2e/user_theme.mjs` and seed `test/e2e/seed.rb`.

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

The plugin has no permissions, menus, settings, routes, macros, mail, rake tasks or migrations. `admin`, `manager`, `reporter` are all exercised (any logged in user may choose a theme); `outsider` has no extra path here. Not in scope: themes themselves (see below).

## Open questions for Jan

1. Keep this plugin or move to `haru/redmine_theme_changer` 0.7.1 (needs a migration of `others[:ui_theme]`)? Chosen: keep, it works on 7.0 and is now tested. Recommendation: keep until a theme_changer migration is wanted for other reasons.
2. Which themes does production offer, and are they in `themes/`? Not knowable from here; see "After the upgrade". PurpleMine2 must be updated or replaced by `gagnieray/opale` (separate task).
3. Two items from the work list need the production server: which remote/commit runs (expected siberianlove 0f261fe, item 2) and the fork/replace decision (item 3, the fork exists now).

## Work list for the migration session

In this order: things that break, security, the GEOxyz changes, the open items, then the checks.

**Priority items**

1. DONE: repair or replace the 6 stale tests (they use a `ui_theme` attribute that UserPreference no longer has; the code itself stores the choice in pref.others[:ui_theme]).

**Open items from the analysis** (Dutch; where they conflict with a decision or a priority item above, those win)

2. OPEN (needs the server): op de server bevestigen welke remote/commit draait (verwacht siberianlove 0f261fe)
3. DONE (fork exists; the replacement question is open question 1): Jan: die repo forken naar jcatrysse zodat een harness-run en redmine70-migration mogelijk zijn, of overstappen op redmine_theme_changer 0.7.1 met datamigratie
4. DONE (the sprite follows the user theme, e2e step 3): op 7.0 testen of de iconensprite het gebruikersthema volgt (IconsHelper#sprite_source gebruikt current_theme, nieuw in 6/7)
5. OPEN (production themes, see After the upgrade): thema's verplaatsen van public/themes naar themes/ (7.0 scant public/themes niet meer) en elk thema testen op header/gebruikersmenu/SVG-iconen
6. OPEN (separate task): PurpleMine2 (Jans fork) is een thema-risico: upstream stil sinds 2023-11 en verwijst naar de onderhouden fork gagnieray/opale (claimt 5.x/6.x/7.x)

**Checks**

7. DONE: run the plugin's whole test suite on Redmine 7.0-stable-GEOxyz with PostgreSQL AND MariaDB, and once on 5.1-stable if the branch is meant to stay 5.1-compatible.
8. DONE (nothing needed): check Redmine 7 webhooks against this plugin (see "Rules"), and note the result here even if nothing is needed.
9. DONE: verify every feature of the plugin by hand on a running Redmine 7 (screenshots).

## GEOxyz changes to review or re-apply

None: this branch carries no GEOxyz commits of its own (upstream code only).

## After the upgrade (production)

Actions the person doing the upgrade must take, or know about, for this plugin:

- Themes move from public/themes to themes/ (Redmine 7 scans themes/ and app/assets/themes/ only). Each theme needs stylesheets/application.css; a theme may ship images/icons.svg (measured: the per-user theme also drives the icon sprite on Redmine 7).

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

On GitHub the same runs by hand only: Actions > "Redmine tests (manual)" > Run workflow (tick
"e2e" for the browser run; screenshots come back as an artifact).

The coordinator's harness (`plugin-check.sh` in the migration kit, kept outside this repo) adds a
browser smoke test of every page the plugin adds and runs all GEOxyz plugins together; the
results quoted in the analysis come from it.

## How the migration session works (same for every plugin)

1. **Start**: `git fetch && git checkout redmine70-migration && git pull`. Read this whole file,
   including the analysis report at the bottom. Do not reopen decisions recorded here.
2. **Baseline, before you change anything**:
   - the plugin's tests on Redmine 7.0-stable-GEOxyz with PostgreSQL and with MariaDB;
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
6. **Portability**: everything must run on Redmine's supported databases (PostgreSQL,
   MySQL/MariaDB; SQLite where the plugin already supports it). Migrations must be reversible and
   are run down and up on PostgreSQL and MariaDB.
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
   - Before pictures where behaviour or layout changes: the branch GEOxyz runs today, on
     Redmine 5.1, same scenarios, `RMP_E2E_OUT=docs/e2e/before`.
   - Run the whole e2e set once on MariaDB as well (`RMP_DB=mariadb`, then `start_server.sh --reset`).
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
- **5.1 compatibility**: prefer fixes that also run on Redmine 5.1 so they can be merged early;
  say so when a fix cannot.
- **Git**: work on `redmine70-migration` only; never push to the default branch; never force-push
  a branch someone else uses. Descriptive commit messages (what and why). Push after every
  commit, together with the updated status in this file: a cloud session can stop at a usage
  limit, and work that is not pushed is lost with its container.
- **GitHub Actions**: manual only (`workflow_dispatch`). Do not add push, pull_request or schedule
  triggers.

## Definition of done

- All items of the work list are done or explicitly deferred with a reason, in this file.
- The plugin's tests are green on Redmine 7.0-stable-GEOxyz with PostgreSQL and MariaDB
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

