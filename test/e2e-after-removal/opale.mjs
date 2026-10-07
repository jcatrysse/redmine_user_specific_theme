// Replace PurpleMine2 by Opale (Jan, 2026-10-07): Opale 1.7.2 in themes/opale on Redmine 7,
// set as the global theme; the main pages as admin, manager, reporter and outsider, desktop and
// mobile width. Asset failures (404 on a font or image) are problems; the pictures are the evidence
// for visual breakage and are reviewed by hand (findings in the plan, "Opale on Redmine 7").
//   RMP_E2E_OUT=docs/e2e node test/e2e-after-removal/opale.mjs
import { e2e } from '../../.codex/e2e/lib.mjs';

const expect = (t, ok, msg) => { if (!ok) t.problems.push('ASSERT ' + msg); console.log((ok ? 'ok   ' : 'FAIL ') + msg); };
const sheet = t => t.page.evaluate(() => [...document.querySelectorAll('link[rel=stylesheet]')].map(l => l.href).join(' '));

async function globalTheme(t, theme) {
  await t.login('admin');
  await t.go('/settings?tab=display');
  await t.page.selectOption('#settings_ui_theme', theme);
  await t.page.click('#tab-content-display input[type=submit], #tab-content-display input[name=commit]');
  await t.settle();
  t.check(`global theme ${theme || '(blank)'}`);
}
async function users(t) {
  // users from the conversion keep their own theme; for these pictures everybody follows Opale
  for (const login of ['manager', 'reporter', 'outsider']) {
    await t.login(login);
    await t.go('/my/account');
    await t.page.selectOption('select[name="pref[theme]"]', '__system_setting__');
    await t.page.click('input[name=commit]');
    await t.settle();
    t.check(`${login} follows the system setting`);
  }
}
const issue = async t => {
  await t.go('/projects/e2e-project/issues');
  return t.page.locator('table.issues tr.issue a[href*="/issues/"]').first().getAttribute('href');
};

const t = await e2e('opale');
await users(t);
await globalTheme(t, 'opale');
expect(t, (await sheet(t)).includes('/themes/opale/'), 'Opale stylesheet is served from themes/opale');
const font = await t.page.evaluate(async () => {
  await document.fonts.ready;
  return [...document.fonts].filter(f => /tabler/i.test(f.family)).map(f => f.status).join(',');
});
expect(t, /loaded/.test(font), `Opale icon font (tabler-icons) loaded (${font})`);
await t.go('/projects');
await t.shot('projects', 'Admin, project list with Opale');
await t.go('/admin');
await t.shot('admin', 'Administration with Opale');
await t.go('/settings?tab=display');
await t.shot('admin-settings', 'Administration > Settings > Display: Opale selected as the global theme');

await t.login('manager');
const href = await issue(t);
await t.shot('issues', 'Manager, issue list with Opale (sidebar, filters, icons)');
await t.go(href);
await t.shot('issue', 'Manager, issue page with Opale');
await t.page.click('a.icon-edit, a:has-text("Edit")');
await t.settle();
await t.shot('issue-edit', 'Manager, issue edit form with Opale');
await t.go('/projects/e2e-project/wiki');
await t.shot('wiki', 'Manager, wiki page with Opale');
await t.go('/my/page');
await t.shot('my-page', 'Manager, My page with Opale');
await t.go('/my/account');
await t.shot('my-account', 'Manager, My account with Opale (theme_changer selector)');
await t.go('/projects/e2e-project/settings');
await t.shot('project-settings', 'Manager, project settings with Opale');

await t.login('reporter');
await t.go(href);
await t.shot('issue-reporter', 'Reporter, issue page with Opale (no edit rights beyond the core Reporter role)');
await t.go('/projects/e2e-project/settings', { status: 403 });
await t.shot('reporter-settings-refused', 'Reporter: project settings refused (403), error page in Opale');

await t.login('outsider');
await t.go('/projects');
expect(t, !(await t.page.locator('#content').innerText()).includes('e2e-private'), 'outsider does not see the private project');
await t.shot('outsider-projects', 'Outsider, project list with Opale: the private project is not listed');
await t.go('/projects/e2e-private', { status: 403 });
await t.shot('outsider-private-refused', 'Outsider: private project refused (403) in Opale');

await t.anonymous();
await t.go('/login');
await t.shot('login', 'Anonymous, login page with Opale');
await t.done();

// Mobile width.
const m = await e2e('opale-mobile', { width: 390, height: 844 });
await m.login('manager');
await m.go('/projects/e2e-project/issues');
await m.shot('issues', 'Mobile width (390px), issue list with Opale');
await m.go(href);
await m.shot('issue', 'Mobile width, issue page with Opale');
await m.page.click('.mobile-toggle-button, #main-menu .mobile-toggle-button, .js-flyout-menu-toggle-button').catch(() => {});
await m.settle();
await m.shot('menu-open', 'Mobile width, flyout menu opened with Opale');
await m.go('/my/page');
await m.shot('my-page', 'Mobile width, My page with Opale');
await m.done();

const r = await e2e('opale-restore');
await globalTheme(r, '');
await r.done();
process.exit(t.problems.length || m.problems.length || r.problems.length ? 1 : 0);
