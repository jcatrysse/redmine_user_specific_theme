# theme-conversion

Run 2026-10-07T20:04:15.695Z against http://127.0.0.1:3001.

| screenshot | user | URL | shows |
|---|---|---|---|
| ![](theme-conversion-both-selectors.png) | manager | `/my/account` | Transition: both plugins installed, My account has both Theme selectors; manager chose e2e_blue with this plugin |
| ![](theme-conversion-manager-converted.png) | manager | `/my/account` | After the conversion: theme_changer's selector shows manager's e2e_blue |
| ![](theme-conversion-reporter-converted.png) | reporter | `/my/account` | Reporter (no plugin permissions): e2e_red carried over |
| ![](theme-conversion-outsider-mapped.png) | outsider | `/my/account` | Outsider (no membership): PurpleMine2 choice converted to Opale through THEME_MAP |
| ![](theme-conversion-outsider-private-refused.png) | outsider | `/projects/e2e-private` | Outsider still cannot open the private project (403) |
| ![](theme-conversion-admin-no-choice.png) | admin | `/my/account` | Admin had no personal theme: no row, theme_changer follows the system setting |
| ![](theme-conversion-reverted.png) | reporter | `/my/account` | After revert: reporter keeps the "Default" chosen in theme_changer after the conversion |
