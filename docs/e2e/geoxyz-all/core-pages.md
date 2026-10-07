# core-pages

Run 2026-10-07T20:22:26.224Z against http://127.0.0.1:3001.

| screenshot | user | URL | shows |
|---|---|---|---|
| ![](core-pages-admin-project-settings.png) | admin | `/projects/e2e-project/settings` | admin: Project > Settings answers 200 |
| ![](core-pages-admin-issues.png) | admin | `/projects/e2e-project/issues` | admin: issue list answers 200 |
| ![](core-pages-admin-issue.png) | admin | `/issues/7` | admin: issue page answers 200 |
| ![](core-pages-admin-my-account.png) | admin | `/my/account` | admin: My account answers 200 with the theme selector(s) |
| ![](core-pages-manager-project-settings.png) | manager | `/projects/e2e-project/settings` | manager: Project > Settings answers 200 |
| ![](core-pages-manager-issues.png) | manager | `/projects/e2e-project/issues` | manager: issue list answers 200 |
| ![](core-pages-manager-issue.png) | manager | `/issues/7` | manager: issue page answers 200 |
| ![](core-pages-manager-my-account.png) | manager | `/my/account` | manager: My account answers 200 with the theme selector(s) |
| ![](core-pages-reporter-settings-refused.png) | reporter | `/projects/e2e-project/settings` | reporter (core Reporter role): Project > Settings refused (403) |
| ![](core-pages-outsider-private-refused.png) | outsider | `/projects/e2e-private/settings` | outsider: settings of the private project refused (403) |
