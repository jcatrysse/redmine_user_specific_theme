// Switch to redmine_theme_changer (Jan, 2026-10-07): the production transition with both plugins
// installed. Users choose with this plugin, the rake task copies the choices to theme_changer
// (dry run, run, run again, revert, run), and theme_changer's selector shows them.
// Needs redmine_theme_changer 0.7.1 in redmine/plugins and themes/opale (see the plan, "How to test").
// Runs after user_theme.mjs (file order). The state after removing this plugin is checked by test/e2e-after-removal/theme_changer.mjs.
import { execFileSync } from 'node:child_process';
import { e2e } from '../../.codex/e2e/lib.mjs';

const t = await e2e('theme-conversion');
const expect = (ok, msg) => { if (!ok) t.problems.push('ASSERT ' + msg); console.log((ok ? 'ok   ' : 'FAIL ') + msg); };
const REDMINE = process.env.REDMINE_DIR || 'redmine';
const ours = () => t.page.inputValue('select[name="pref[ui_theme]"]');
const theirs = () => t.page.inputValue('select[name="pref[theme]"]');
function rake(task, env = {}) {
  const out = execFileSync('bundle', ['exec', 'rake', `redmine_user_specific_theme:${task}`], {
    cwd: REDMINE, env: { ...process.env, RAILS_ENV: process.env.RMP_SERVER_ENV || 'production', ...env },
  }).toString();
  console.log(`rake ${task} ${JSON.stringify(env)}\n${out.trim().replace(/^/gm, '     | ')}`);
  return out;
}
async function save(theme) {
  await t.go('/my/account');
  await t.page.selectOption('select[name="pref[ui_theme]"]', theme);
  await t.page.click('input[name=commit]');
  await t.settle();
  t.check(`save theme ${theme}`);
}
async function selectors(login) {
  await t.login(login);
  await t.go('/my/account');
  return { ours: await ours(), theirs: await theirs() };
}

// 1. Both plugins installed: My account shows both selectors; users choose with this plugin.
await t.login('manager');
await t.go('/my/account');
expect(await t.page.locator('select[name="pref[theme]"]').count() === 1, 'redmine_theme_changer is installed (its selector is on My account)');
await save('e2e_blue');
await t.shot('both-selectors', 'Transition: both plugins installed, My account has both Theme selectors; manager chose e2e_blue with this plugin');
await t.login('reporter');
await save('e2e_red');
const outsider = await selectors('outsider');
expect(outsider.ours === '', `outsider's stored purplemine2 is not installed, our selector shows blank (${outsider.ours})`);

// 2. The conversion: dry run, run, idempotent rerun.
const map = { THEME_MAP: 'purplemine2:opale' };
let out = rake('convert_to_theme_changer', { ...map, DRY_RUN: '1' });
expect(/DRY RUN, nothing saved/.test(out), 'dry run says nothing is saved');
let m = await selectors('manager');
expect(m.theirs === '__system_setting__', `after the dry run theme_changer has no row for manager (${m.theirs})`);
out = rake('convert_to_theme_changer', map);
// manager and reporter saved My account with both plugins installed, which made theme_changer
// store "use system setting" for them; the conversion replaces that, it is the same as no row
expect(/updated: user \d+: e2e_blue \(was __system_setting__\)/.test(out) && /updated: user \d+: e2e_red/.test(out) && /created: user \d+: opale/.test(out),
  'conversion sets e2e_blue (manager) and e2e_red (reporter) over "use system setting", creates opale (outsider, mapped from purplemine2)');
out = rake('convert_to_theme_changer', map);
expect(!/created:/.test(out) && /unchanged: user \d+: e2e_blue/.test(out), 'second run changes nothing (idempotent)');

// 3. theme_changer's selector shows the converted choice for every user.
m = await selectors('manager');
expect(m.theirs === 'e2e_blue', `manager: theme_changer has e2e_blue (${m.theirs})`);
await t.shot('manager-converted', 'After the conversion: theme_changer\'s selector shows manager\'s e2e_blue');
const r = await selectors('reporter');
expect(r.theirs === 'e2e_red', `reporter: theme_changer has e2e_red (${r.theirs})`);
await t.shot('reporter-converted', 'Reporter (no plugin permissions): e2e_red carried over');
const o = await selectors('outsider');
expect(o.theirs === 'opale', `outsider: purplemine2 became opale (${o.theirs})`);
await t.shot('outsider-mapped', 'Outsider (no membership): PurpleMine2 choice converted to Opale through THEME_MAP');
await t.go('/projects/e2e-private', { status: 403 });
await t.shot('outsider-private-refused', 'Outsider still cannot open the private project (403)');
const a = await selectors('admin');
expect(a.theirs === '__system_setting__', `admin without a choice keeps "use system setting" (${a.theirs})`);
await t.shot('admin-no-choice', 'Admin had no personal theme: no row, theme_changer follows the system setting');

// 4. Revert removes exactly the converted rows; a choice made in theme_changer afterwards is kept.
await t.login('reporter');
await t.go('/my/account');
await t.page.selectOption('select[name="pref[theme]"]', '__default_theme__');
await t.page.click('input[name=commit]');
await t.settle();
t.check('reporter changes theme_changer choice');
out = rake('revert_theme_changer_conversion', map);
expect(/removed: user \d+: e2e_blue/.test(out) && /removed: user \d+: opale/.test(out) && /kept: user \d+: e2e_red/.test(out),
  'revert removes manager and outsider rows, keeps reporter\'s own later choice');
m = await selectors('manager');
expect(m.theirs === '__system_setting__', `manager back to no row after revert (${m.theirs})`);
const r2 = await selectors('reporter');
expect(r2.theirs === '__default_theme__', `reporter keeps the choice made in theme_changer (${r2.theirs})`);
await t.shot('reverted', 'After revert: reporter keeps the "Default" chosen in theme_changer after the conversion');

// 5. Anonymous: My account still demands a login.
await t.anonymous();
await t.go('/my/account');
expect(t.page.url().includes('/login'), 'anonymous /my/account redirects to login');

// Final state for the after-removal run: reporter back to e2e_red in theme_changer, convert again.
await t.login('reporter');
await t.go('/my/account');
await t.page.selectOption('select[name="pref[theme]"]', 'e2e_red');
await t.page.click('input[name=commit]');
await t.settle();
out = rake('convert_to_theme_changer', map);
expect(/created: user \d+: e2e_blue/.test(out) && /unchanged: user \d+: e2e_red/.test(out), 'final conversion for the after-removal run');
await t.done();
process.exit(t.problems.length ? 1 : 0);
