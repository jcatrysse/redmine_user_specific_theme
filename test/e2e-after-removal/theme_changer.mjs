// Switch to redmine_theme_changer (Jan, 2026-10-07): the state after the conversion, with
// redmine_user_specific_theme removed from plugins/ and the server restarted. Every user sees the
// converted theme, theme_changer's own functions work (a user picks a theme, the admin default,
// a user without a choice, "Default"), and its failure paths are recorded.
// Run with node directly (e2e.sh needs this plugin installed), after test/e2e/user_theme_to_theme_changer.mjs:
//   RMP_E2E_OUT=docs/e2e node test/e2e-after-removal/theme_changer.mjs
import { e2e } from '../../.codex/e2e/lib.mjs';

const t = await e2e('theme-changer');
const PW = process.env.RMP_USER_PASSWORD || process.env.RMP_ADMIN_PASSWORD || 'Redmine7Test!';
const RED = 'rgb(192, 57, 43)', BLUE = 'rgb(41, 128, 185)';
const expect = (ok, msg) => { if (!ok) t.problems.push('ASSERT ' + msg); console.log((ok ? 'ok   ' : 'FAIL ') + msg); };
const header = () => t.page.evaluate(() => getComputedStyle(document.querySelector('#top-menu')).backgroundColor);
const bodyClass = () => t.page.evaluate(() => document.body.className);
const sheet = () => t.page.evaluate(() => [...document.querySelectorAll('link[rel=stylesheet]')].map(l => l.href).join(' '));
const sprites = () => t.page.evaluate(() => [...document.querySelectorAll('use')].map(u => u.getAttribute('href') || '').filter(Boolean));
const select = () => t.page.inputValue('select[name="pref[theme]"]');
async function save(theme) {
  await t.go('/my/account');
  await t.page.selectOption('select[name="pref[theme]"]', theme);
  await t.page.click('input[name=commit]');
  await t.settle();
  t.check(`save theme ${theme}`);
}
async function globalTheme(theme) {
  await t.login('admin');
  await t.go('/settings?tab=display');
  await t.page.selectOption('#settings_ui_theme', theme);
  await t.page.click('#tab-content-display input[type=submit], #tab-content-display input[name=commit]');
  await t.settle();
  t.check(`global theme ${theme || '(blank)'}`);
}
async function csrfPut(url, body) {
  return t.page.evaluate(async ([u, b]) => {
    const token = document.querySelector('meta[name=csrf-token]').content;
    const r = await fetch(u, { method: 'PUT', headers: { 'X-CSRF-Token': token, 'Content-Type': 'application/x-www-form-urlencoded' }, body: b, redirect: 'manual' });
    return r.status;
  }, [url, body]);
}

// 0. Only theme_changer is installed.
await t.login('admin');
await t.go('/admin/plugins');
const plugins = await t.page.locator('#content').innerText();
expect(/Theme Changer/.test(plugins) && !/User-Specific Theme/.test(plugins), 'plugin list: theme_changer present, redmine_user_specific_theme removed');
await t.shot('plugins', 'Administration > Plugins: Redmine Theme Changer 0.7.1, redmine_user_specific_theme removed');

// 1. Converted choices are in effect.
await t.login('manager');
await t.go('/projects/e2e-project/issues');
expect(await header() === BLUE, 'manager: converted e2e_blue is applied');
expect((await bodyClass()).includes('theme-E2e_blue'), 'manager: body class theme-E2e_blue');
const uses = await sprites();
const fromTheme = uses.filter(h => h.includes('/themes/e2e_blue/')).length;
expect(fromTheme > 0, `manager: icon sprite comes from the blue theme (${fromTheme} of ${uses.length})`);
await t.shot('manager-blue', 'Manager after the switch: e2e_blue from the conversion (header, body class, the theme\'s icon sprite)');
await t.login('reporter');
await t.go('/projects/e2e-project/issues');
expect(await header() === RED, 'reporter: converted e2e_red is applied');
await t.shot('reporter-red', 'Reporter (no plugin permissions) after the switch: e2e_red');
await t.login('outsider');
await t.go('/projects');
expect((await sheet()).includes('/themes/opale/'), 'outsider: PurpleMine2 choice now shows Opale');
await t.shot('outsider-opale', 'Outsider: the PurpleMine2 choice was converted to Opale');
await t.go('/projects/e2e-private', { status: 403 });
await t.shot('outsider-private-refused', 'Outsider with Opale: the private project stays refused (403)');

// 2. Admin default: a user without a choice follows it, a personal choice wins.
await t.login('admin');
await t.go('/my/account');
expect(await select() === '__system_setting__', 'admin has no row: "use system setting"');
await globalTheme('e2e_red');
await t.go('/projects');
expect(await header() === RED, 'admin without a choice follows the global e2e_red');
await t.shot('admin-default', 'Administration > Settings > Display = e2e_red: admin (no personal choice) follows it');
await t.login('manager');
await t.go('/projects');
expect(await header() === BLUE, 'manager personal e2e_blue wins over the global e2e_red');
await t.shot('personal-wins', 'Manager keeps the personal e2e_blue while the global theme is e2e_red');

// 3. A user picks a theme, "Default" (no theme), back to the system setting.
await t.login('reporter');
await save('e2e_blue');
expect(await header() === BLUE && await select() === 'e2e_blue', 'reporter picks e2e_blue in theme_changer');
await t.shot('reporter-picks', 'Reporter picks e2e_blue in theme_changer\'s selector (My account)');
await save('__default_theme__');
expect(![RED, BLUE].includes(await header()), '"Default" gives the core look although the global theme is red');
await t.shot('reporter-default', '"Default": Redmine\'s own look, not the global e2e_red');
await save('__system_setting__');
expect(await header() === RED, '"Use system setting" follows the global e2e_red again');
await t.shot('reporter-system', '"Use system setting": back to the global e2e_red');

// 4. Failure paths.
const before = await select();
const status = await csrfPut('/my/account', 'pref%5Btheme%5D=nosuchtheme'); // 0 = the redirect, fetch with redirect: manual
await t.go('/my/account');
expect(![RED, BLUE].includes(await header()), `FINDING: a forged pref[theme]=nosuchtheme (status ${status}) is stored, the user gets no theme at all (was ${before})`);
await t.shot('forged-value', 'Finding: theme_changer stores any pref[theme] value; "nosuchtheme" leaves the user without a theme (core look, not the global red)');
await save('e2e_red');
const auth = { Authorization: 'Basic ' + Buffer.from('reporter:' + PW).toString('base64'), 'Content-Type': 'application/json' };
let r = await t.page.request.put(t.BASE + '/my/account.json', { headers: auth, data: { pref: { theme: 'e2e_blue' } } });
expect(r.status() === 204, `API PUT /my/account.json pref.theme (status ${r.status()})`);
await t.go('/my/account');
expect(await select() === 'e2e_blue', 'API changed the theme_changer choice');
await t.shot('api-change', 'Theme changed through the REST API (PUT /my/account.json, pref.theme)');
await save('e2e_red');
const admin = { Authorization: 'Basic ' + Buffer.from('admin:' + (process.env.RMP_ADMIN_PASSWORD || 'Redmine7Test!')).toString('base64'), 'Content-Type': 'application/json' };
const login = 'tc' + Date.now().toString(36);
r = await t.page.request.post(t.BASE + '/users.json', { headers: admin, data: { user: { login, firstname: 'T', lastname: 'C', mail: login + '@example.net', password: 'Redmine7Test!' }, pref: { theme: 'e2e_red' } } });
// FINDING (theme_changer 0.7.1): UserPreference#theme= saves a row for a user that has no id yet,
// validation "User cannot be blank" raises, the API answers 422 and the user is not created
expect(r.status() === 422, `FINDING: admin creates a user with pref.theme through the API: refused (status ${r.status()})`);
r = await t.page.request.post(t.BASE + '/users.json', { headers: admin, data: { user: { login: login + 'b', firstname: 'T', lastname: 'C', mail: login + 'b@example.net', password: 'Redmine7Test!' } } });
expect(r.status() === 201, `the same without pref.theme creates the user (status ${r.status()})`);

// 5. Anonymous: global theme, My account needs a login.
await t.anonymous();
await t.go('/login');
expect(await header() === RED, 'anonymous login page uses the global e2e_red');
await t.shot('anonymous-global', 'Anonymous visitor: the global e2e_red on the login page');
await t.go('/my/account');
expect(t.page.url().includes('/login'), 'anonymous /my/account redirects to login');

await globalTheme('');
await t.done();
process.exit(t.problems.length ? 1 : 0);
