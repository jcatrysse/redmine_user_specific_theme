# opale

Run 2026-10-07T20:19:09.848Z against http://127.0.0.1:3001.

| screenshot | user | URL | shows |
|---|---|---|---|
| ![](opale-projects.png) | admin | `/projects` | Admin, project list with Opale |
| ![](opale-admin.png) | admin | `/admin` | Administration with Opale |
| ![](opale-admin-settings.png) | admin | `/settings?tab=display` | Administration > Settings > Display: Opale selected as the global theme |
| ![](opale-issues.png) | manager | `/projects/e2e-project/issues` | Manager, issue list with Opale (sidebar, filters, icons) |
| ![](opale-issue.png) | manager | `/issues/7` | Manager, issue page with Opale |
| ![](opale-issue-edit.png) | manager | `/issues/7` | Manager, issue edit form with Opale |
| ![](opale-wiki.png) | manager | `/projects/e2e-project/wiki` | Manager, wiki page with Opale |
| ![](opale-my-page.png) | manager | `/my/page` | Manager, My page with Opale |
| ![](opale-my-account.png) | manager | `/my/account` | Manager, My account with Opale (theme_changer selector) |
| ![](opale-project-settings.png) | manager | `/projects/e2e-project/settings` | Manager, project settings with Opale |
| ![](opale-issue-reporter.png) | reporter | `/issues/7` | Reporter, issue page with Opale (no edit rights beyond the core Reporter role) |
| ![](opale-reporter-settings-refused.png) | reporter | `/projects/e2e-project/settings` | Reporter: project settings refused (403), error page in Opale |
| ![](opale-outsider-projects.png) | outsider | `/projects` | Outsider, project list with Opale: the private project is not listed |
| ![](opale-outsider-private-refused.png) | outsider | `/projects/e2e-private` | Outsider: private project refused (403) in Opale |
| ![](opale-login.png) | anonymous | `/login` | Anonymous, login page with Opale |

## Problems

- /issues/7 as reporter: HTTP 403, expected 200
