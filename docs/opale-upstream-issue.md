# Ready-to-post issue for gagnieray/opale

Prepared 2026-10-07 on Jan's decision ("Wel melden", docs/DECISIONS-2026-10-07.md, round 3).
Jan posts it himself at https://github.com/gagnieray/opale/issues/new; nobody else contacts the
maintainer. Copy everything below the line. The images point to this branch on GitHub
(`jcatrysse/redmine_user_specific_theme`, `redmine70-migration`), so they show as long as the branch
exists; to make them permanent, drag the PNG files from `docs/e2e/opale-upstream/` into the issue
instead.

Left out on purpose, after comparing with Redmine's own look on the same pages:
- the reaction (thumbs up) button under "Next »" on the issue page: core Redmine 7 puts it there too;
- the sticky issue header strip in a full-page screenshot of the edit form: a screenshot effect, not
  something a user sees.

---

**Title:** Redmine 7.0: small layout issues on narrow screens (journal header, clipped table text, progress bars) and the sidebar toggle position

Hello, and thank you for Opale. We are replacing PurpleMine2 with it on Redmine 7.0 and tested it there.
Everything works: the stylesheet and the tabler icon font load without errors, and we saw no broken page.
We did notice a few small layout points. Each one was compared with the same page in Redmine's default
theme, which does not show it.

**Versions**
- Opale 1.7.2 (release zip `opale-1.7.2.zip`, unpacked as `themes/opale`), set as the global theme
  (Administration > Settings > Display)
- Redmine 7.0.1 (built from the 7.0-stable branch), Rails 8.1.3.1, Ruby 3.3.6, PostgreSQL 16, production mode
- Chromium 141 (Playwright); "mobile" means a 390 x 844 viewport

### 1. Narrow screens: the journal header spills out of its box

Steps: open an issue that has a note, at 390 px width, Notes or History tab.
The header line "Updated by <user> about 2 hours ago" wraps, and the wrapped part ("2 hours ago") and the
`...` menu end up under the avatar, outside the bordered journal box. With the default theme the header
wraps inside the box.

| default theme | Opale 1.7.2 |
|---|---|
| ![core](https://raw.githubusercontent.com/jcatrysse/redmine_user_specific_theme/redmine70-migration/docs/e2e/opale-upstream/core-mobile-issue.png) | ![opale](https://raw.githubusercontent.com/jcatrysse/redmine_user_specific_theme/redmine70-migration/docs/e2e/opale-upstream/opale-mobile-issue.png) |

### 2. Narrow screens: progress bars under Subtasks and Related issues stick out

Steps: same issue page at 390 px, an issue with a subtask and a related issue.
The small done-ratio bars in the Subtasks and Related issues tables run past the right edge of the
content (see the same screenshots as point 1). With the default theme they stay inside.

### 3. Narrow screens: long subjects are clipped in the issue list and in My page blocks

Steps: at 390 px, open a project's issue list, and My page with the "Issues assigned to me" and
"Reported issues" blocks, with an issue whose subject contains a long word (for example a number such as
`1791401953163`).
The Subject column is cut off at the right edge of the screen (the last characters are not visible and
the table cannot be scrolled sideways). With the default theme the long word wraps and stays readable.

| default theme, issue list | Opale, issue list | default theme, My page | Opale, My page |
|---|---|---|---|
| ![core list](https://raw.githubusercontent.com/jcatrysse/redmine_user_specific_theme/redmine70-migration/docs/e2e/opale-upstream/core-mobile-issues.png) | ![opale list](https://raw.githubusercontent.com/jcatrysse/redmine_user_specific_theme/redmine70-migration/docs/e2e/opale-upstream/opale-mobile-issues.png) | ![core my page](https://raw.githubusercontent.com/jcatrysse/redmine_user_specific_theme/redmine70-migration/docs/e2e/opale-upstream/core-mobile-my-page.png) | ![opale my page](https://raw.githubusercontent.com/jcatrysse/redmine_user_specific_theme/redmine70-migration/docs/e2e/opale-upstream/opale-mobile-my-page.png) |

### 4. Desktop: the sidebar collapse button sits on the edge of the window (minor)

Steps: any page with a sidebar (issue list, issue page) at 1366 px width.
The sidebar collapse button (`«`, new in Redmine 6.1) is drawn as a small bordered square against the
left edge of the window, overlapping the bottom border of the project menu, instead of inside the
sidebar. This may be intended with the left sidebar; it just looks slightly cut off.

| default theme | Opale 1.7.2 |
|---|---|
| ![core toggle](https://raw.githubusercontent.com/jcatrysse/redmine_user_specific_theme/redmine70-migration/docs/e2e/opale-upstream/core-sidebar-toggle.png) | ![opale toggle](https://raw.githubusercontent.com/jcatrysse/redmine_user_specific_theme/redmine70-migration/docs/e2e/opale-upstream/opale-sidebar-toggle.png) |

None of these blocks us; we are reporting them in case they are useful. Happy to test a fix on Redmine 7.0.
