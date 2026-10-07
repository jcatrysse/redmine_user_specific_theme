// Core pages with this plugin (and, in the combination run, with all GEOxyz plugins and
// redmine_theme_changer installed; Jan, 2026-10-07): Project > Settings, the issue list, an issue
// page and My account answer 200, and the refusals stay refusals.
import { e2e } from '../../.codex/e2e/lib.mjs';

const t = await e2e('core-pages');
const expect = (ok, msg) => { if (!ok) t.problems.push('ASSERT ' + msg); console.log((ok ? 'ok   ' : 'FAIL ') + msg); };

for (const login of ['admin', 'manager']) {
  await t.login(login);
  await t.go('/projects/e2e-project/settings');
  await t.shot(`${login}-project-settings`, `${login}: Project > Settings answers 200`);
  await t.go('/projects/e2e-project/issues');
  const href = await t.page.locator('table.issues tr.issue a[href*="/issues/"]').first().getAttribute('href');
  await t.shot(`${login}-issues`, `${login}: issue list answers 200`);
  await t.go(href);
  await t.shot(`${login}-issue`, `${login}: issue page answers 200`);
  await t.go('/my/account');
  expect(await t.page.locator('select[name^="pref["][name$="theme]"]').count() >= 1, `${login}: My account has a theme selector`);
  await t.shot(`${login}-my-account`, `${login}: My account answers 200 with the theme selector(s)`);
}
await t.login('reporter');
await t.go('/projects/e2e-project/issues');
await t.go('/projects/e2e-project/settings', { status: 403 });
await t.shot('reporter-settings-refused', 'reporter (core Reporter role): Project > Settings refused (403)');
await t.login('outsider');
await t.go('/projects/e2e-private/settings', { status: 403 });
await t.shot('outsider-private-refused', 'outsider: settings of the private project refused (403)');
await t.done();
process.exit(t.problems.length ? 1 : 0);
