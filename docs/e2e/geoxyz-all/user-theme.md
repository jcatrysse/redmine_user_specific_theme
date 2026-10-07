# user-theme

Run 2026-10-07T20:00:28.922Z against http://127.0.0.1:3001.

| screenshot | user | URL | shows |
|---|---|---|---|
| ![](user-theme-selector-default.png) | manager | `/my/account` | My account: the Theme selector with a blank choice and the two installed themes; nothing chosen, core look |
| ![](user-theme-chosen-red.png) | manager | `/my/account` | After saving: the page is restyled with the red user theme (header, body class, stylesheet) |
| ![](user-theme-issues-red.png) | manager | `/projects/e2e-project/issues` | The issue list keeps the red theme |
| ![](user-theme-issues-blue-icons.png) | manager | `/projects/e2e-project/issues` | Blue user theme on the issue list: header colour and the theme's own icon sprite |
| ![](user-theme-other-user-unaffected.png) | reporter | `/my/account` | Another user (no plugin permissions needed) keeps the global look while manager has blue |
| ![](user-theme-reporter-chooses.png) | reporter | `/my/account` | Reporter chooses red; no project permission is involved |
| ![](user-theme-reporter-cleared.png) | reporter | `/my/account` | Blank choice clears the personal theme |
| ![](user-theme-global-theme.png) | admin | `/projects/e2e-project` | Global theme red (Administration > Settings > Display) for a user without a choice |
| ![](user-theme-personal-wins.png) | manager | `/projects/e2e-project` | Manager has blue chosen while the global theme is red: personal choice wins |
| ![](user-theme-invalid-ignored.png) | manager | `/my/account` | After three forged PUTs with invalid theme values the selector still shows the chosen blue theme |
| ![](user-theme-api-change.png) | manager | `/my/account` | Theme changed via the REST API (manager:basic auth); a bogus value was ignored |
| ![](user-theme-anonymous-global.png) | anonymous | `/login` | Anonymous visitor: global red theme on the login page |
