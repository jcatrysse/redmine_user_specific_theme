// Per-user theme: the selector in My account, the stylesheet, body class and icon sprite that
// follow the choice, the global fallback, and the refusal of values that are not installed themes.
import fs from 'node:fs';
import path from 'node:path';
import { e2e } from '../../.codex/e2e/lib.mjs';

const t = await e2e('user-theme');
const PW = process.env.RMP_USER_PASSWORD || process.env.RMP_ADMIN_PASSWORD || 'Redmine7Test!';
const RED = 'rgb(192, 57, 43)', BLUE = 'rgb(41, 128, 185)';
const expect = (ok, msg) => { if (!ok) t.problems.push('ASSERT ' + msg); console.log((ok ? 'ok   ' : 'FAIL ') + msg); };
const header = () => t.page.evaluate(() => getComputedStyle(document.querySelector('#top-menu')).backgroundColor);
const bodyClass = () => t.page.evaluate(() => document.body.className);
const sheet = () => t.page.evaluate(() => [...document.querySelectorAll('link[rel=stylesheet]')].map(l => l.href).join(' '));
const select = () => t.page.inputValue('select[name="pref[ui_theme]"]');
const sprites = () => t.page.evaluate(() => [...document.querySelectorAll('use')].map(u => u.getAttribute('href') || '').filter(Boolean));
async function save(theme) {
  await t.go('/my/account');
  await t.page.selectOption('select[name="pref[ui_theme]"]', theme);
  await t.page.click('input[name=commit]');
  await t.settle();
  t.check(`save theme ${theme || '(blank)'}`);
}
async function csrfPut(url, body) {
  return t.page.evaluate(async ([u, b]) => {
    const token = document.querySelector('meta[name=csrf-token]').content;
    const r = await fetch(u, { method: 'PUT', headers: { 'X-CSRF-Token': token, 'Content-Type': 'application/x-www-form-urlencoded' }, body: b, redirect: 'manual' });
    return r.status;
  }, [url, body]);
}

// 1. The selector, nothing chosen yet: global (default) theme.
await t.login('manager');
await t.go('/my/account');
const opts = await t.page.$$eval('select[name="pref[ui_theme]"] option', o => o.map(x => x.value));
// every theme Redmine 7 scans (themes/ and app/assets/themes/, e.g. opale for the migration run)
const installed = ['themes', 'app/assets/themes'].flatMap(d => {
  const dir = path.join(process.env.REDMINE_DIR || 'redmine', d);
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter(n => fs.existsSync(path.join(dir, n, 'stylesheets', 'application.css'))) : [];
});
expect(opts.includes('') && opts.includes('e2e_blue') && opts.includes('e2e_red') && opts.length === 1 + installed.length, `selector lists blank + installed themes (${opts})`);
expect(await select() === '', 'nothing selected by default');
expect(![RED, BLUE].includes(await header()), 'default header is not a test theme colour');
await t.shot('selector-default', 'My account: the Theme selector with a blank choice and the two installed themes; nothing chosen, core look');

// 2. Choose e2e_red.
await save('e2e_red');
expect(await select() === 'e2e_red', 'selector shows the saved theme after the redirect');
expect(await header() === RED, 'header uses the red theme');
{ const bc = await bodyClass(); expect(bc.includes('theme-E2e_red'), 'body class theme-E2e_red (' + bc + ')'); }
expect((await sheet()).includes('/themes/e2e_red/'), 'stylesheet comes from the red theme');
await t.shot('chosen-red', 'After saving: the page is restyled with the red user theme (header, body class, stylesheet)');
await t.go('/projects/e2e-project/issues');
expect(await header() === RED, 'red theme persists on another page');
await t.shot('issues-red', 'The issue list keeps the red theme');

// 3. Choose e2e_blue: stylesheet and icon sprite both follow.
await save('e2e_blue');
expect(await header() === BLUE, 'header uses the blue theme');
await t.go('/projects/e2e-project/issues');
const uses = await sprites();
const fromTheme = uses.filter(h => h.includes('/themes/e2e_blue/')).length;
expect(fromTheme > 0, `icon sprite comes from the blue theme (${fromTheme} of ${uses.length} icons)`);
const svgOk = await t.page.evaluate(async h => (await fetch(h.split('#')[0])).headers.get('content-type'), uses.find(h => h.includes('/themes/e2e_blue/')));
expect(/svg/.test(svgOk), `theme sprite is served as SVG (${svgOk})`);
await t.shot('issues-blue-icons', 'Blue user theme on the issue list: header colour and the theme\'s own icon sprite');

// 4. Another user is not affected.
await t.login('reporter');
await t.go('/my/account');
expect(await select() === '', 'reporter has no theme chosen');
expect(![RED, BLUE].includes(await header()), 'reporter still sees the core look');
expect(!(await bodyClass()).includes('theme-E2e'), 'reporter body class has no test theme');
await t.shot('other-user-unaffected', 'Another user (no plugin permissions needed) keeps the global look while manager has blue');
await save('e2e_red');
expect(await header() === RED, 'reporter can choose a theme too');
await t.shot('reporter-chooses', 'Reporter chooses red; no project permission is involved');
await save('');
expect(await header() !== RED, 'blank choice returns to the global theme');
expect(await select() === '', 'selector blank again');
await t.shot('reporter-cleared', 'Blank choice clears the personal theme');

// 5. Global theme as fallback; the personal choice wins over it.
await t.login('admin');
await t.go('/settings?tab=display');
await t.page.selectOption('#settings_ui_theme', 'e2e_red');
await t.page.click('#tab-content-display input[type=submit], #tab-content-display input[name=commit]');
await t.settle();
await t.go('/projects/e2e-project');
expect(await header() === RED, 'admin without personal theme gets the global red theme');
await t.shot('global-theme', 'Global theme red (Administration > Settings > Display) for a user without a choice');
await t.login('manager');
await t.go('/projects/e2e-project');
expect(await header() === BLUE, 'manager personal blue wins over global red');
await t.shot('personal-wins', 'Manager has blue chosen while the global theme is red: personal choice wins');
await save('');
await t.go('/projects/e2e-project');
expect(await header() === RED, 'manager cleared: falls back to the global red theme');

// 6. Failure paths: values that are not installed themes are not stored.
await save('e2e_blue');
for (const bad of ['pref%5Bui_theme%5D=..%2F..%2Fetc%2Fpasswd', 'pref%5Bui_theme%5D=nosuchtheme', 'pref%5Bui_theme%5D%5B%5D=e2e_red']) {
  const status = await csrfPut('/my/account', bad);
  await t.go('/my/account');
  expect(await select() === 'e2e_blue', `PUT ${decodeURIComponent(bad)} (status ${status}) leaves the stored theme untouched`);
}
await t.shot('invalid-ignored', 'After three forged PUTs with invalid theme values the selector still shows the chosen blue theme');
await csrfPut('/my/account', 'pref%5Bwarn_on_leaving_unsaved%5D=0');
await t.go('/my/account');
expect(await select() === 'e2e_blue', 'a PUT without the theme parameter keeps the theme');

// 7. REST API.
const auth = { Authorization: 'Basic ' + Buffer.from('manager:' + PW).toString('base64'), 'Content-Type': 'application/json' };
let r = await t.page.request.put(t.BASE + '/my/account.json', { headers: auth, data: { pref: { ui_theme: 'e2e_red' } } });
expect(r.status() === 204, `API PUT /my/account.json status ${r.status()}`);
await t.go('/my/account');
expect(await select() === 'e2e_red', 'API changed the theme');
r = await t.page.request.put(t.BASE + '/my/account.json', { headers: auth, data: { pref: { ui_theme: 'bogus' } } });
await t.go('/my/account');
expect(await select() === 'e2e_red', 'API with a bogus theme keeps the old theme');
await t.shot('api-change', 'Theme changed via the REST API (manager:basic auth); a bogus value was ignored');

// 8. Anonymous: login page uses the global theme; /my/account demands a login.
await t.anonymous();
await t.go('/login');
expect(await header() === RED || (await sheet()).includes('/themes/e2e_red/'), 'anonymous login page uses the global theme');
await t.shot('anonymous-global', 'Anonymous visitor: global red theme on the login page');
await t.go('/my/account', {});
expect(t.page.url().includes('/login'), 'anonymous /my/account redirects to login');

// Restore the global setting and the personal ones.
await t.login('admin');
await t.go('/settings?tab=display');
await t.page.selectOption('#settings_ui_theme', '');
await t.page.click('#tab-content-display input[type=submit], #tab-content-display input[name=commit]');
await t.settle();
await t.login('manager');
await save('');
await t.done();
process.exit(t.problems.length ? 1 : 0);
