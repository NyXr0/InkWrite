# Inkwell: Software Requirements Specification (SRD)

Oct 31, 2026 · @drxtr0men

This document states what Inkwell shall do, in numbered, testable requirements for all 24 requested features, plus the quality attributes the whole product must meet on Windows, Linux and macOS.

## Scope and conventions

The SRD covers the Inkwell desktop application, its project file format and its export outputs. Hosted services, mobile apps and AI writing features are out of scope (see the PRD).

- **Numbering.** FR-n.m is requirement m of feature Fn, using the feature numbers in the PRD. NFR-n is a non-functional requirement.
- **Wording.** "Shall" is mandatory. "Should" is recommended and may slip to a later phase without blocking release.
- **Verification.** Every requirement has an acceptance criterion that a tester can check by test, inspection or demonstration.
- **Priority and phase.** Taken from the PRD feature table; this document does not change them.

**Terms**

| Term | Meaning |
| --- | --- |
| Project | The folder that holds one novel or series |
| Scene | The smallest manuscript unit: one Markdown file |
| Lore entry | A character, location, faction or item profile file |
| Snapshot | A saved copy of one scene on a hidden Git ref |
| Pane | One editor view inside the split-screen area |

## Manuscript organization (F1 to F5)

| ID | Requirement | Acceptance criterion |
| --- | --- | --- |
| FR-1.1 | The manuscript shall be a tree of folders and scenes with at least 6 nesting levels (act, chapter, scene, sub-scene and deeper). | A 6-level tree is created, closed and reopened with identical structure. |
| FR-1.2 | The user shall create, rename, move, duplicate and delete tree items with mouse and keyboard. Moves shall keep all links and comments intact. | A scene that has an @tag reference and a comment is moved; both still resolve. |
| FR-1.3 | Item order shall be stored in the parent folder's `_folder.yml`, so reordering needs no file renames. | Reordering 10 scenes changes only `_folder.yml` in the Git diff. |
| FR-1.4 | The tree shall stay responsive in a project of 1,000 scenes. | Expand all completes in under 300 ms. |
| FR-2.1 | The corkboard shall show one card per scene or chapter in the selected folder, with title, summary, status color, POV and word count. | Card fields match each file's front matter for 50 sample scenes. |
| FR-2.2 | Dragging a card shall reorder it within its folder or move it to another folder, update the tree at once and save the change. | After a drag, tree order and `_folder.yml` match the board; no manual save needed. |
| FR-2.3 | The summary on a card shall be editable in place and stored as the scene's `summary` field. | Edit on the card, reopen the scene file: the front matter shows the new text. |
| FR-2.4 | Cards shall be movable by keyboard alone. | A tester reorders cards using only the keyboard. |
| FR-3.1 | The editor area shall show two panes side by side or stacked, each able to open any scene, lore entry, note or outline. | Open a scene and a character file together and edit both. |
| FR-3.2 | When both panes show the same file, edits in one shall appear in the other within 50 ms. | Type in the left pane; the right pane matches within 50 ms in an automated test. |
| FR-3.3 | Pane layout (orientation, sizes, open files) shall persist per project and toggle with one shortcut. | Restart the app: the same two files open in the same layout. |
| FR-4.1 | Distraction-free mode shall hide menus, sidebars, toolbars, tabs and the status bar and show only the text in a centered column of configurable width. | Screenshot test shows no UI elements other than text. |
| FR-4.2 | Entering the mode shall switch to native fullscreen, hiding the taskbar or dock and system clock where the OS allows. Exit shall restore the previous layout exactly. | Enter and exit on all three operating systems; panes and scroll position are unchanged. |
| FR-4.3 | The command palette shall remain reachable by shortcut inside the mode and disappear after use. | Open the palette, run a command, and the screen returns to text only. |
| FR-5.1 | Focus mode shall dim everything except the current sentence or the current paragraph (user choice), with dim strength configurable. | Caret in sentence 3 of a paragraph: all other text renders dimmed. |
| FR-5.2 | The highlighted unit shall follow the caret within 50 ms of each keystroke or cursor move. | Automated timing test on a 5,000-word scene. |
| FR-5.3 | Focus mode shall combine with distraction-free mode and offer optional typewriter scrolling. | Both modes on together; the caret line stays at a fixed height while typing. |

## World-building and lore (F6 to F9)

| ID | Requirement | Acceptance criterion |
| --- | --- | --- |
| FR-6.1 | The app shall provide templates for characters, locations, factions and items, each with editable fields (for characters: physical traits, motivations, arc, backstory, relationships). | Create one entry of each kind from a template and edit every field. |
| FR-6.2 | Users shall add, rename and remove template fields and define new entry types, and the changes shall be stored in `inkwell.yml`. | Add a custom "Magic system" type; it appears in the new-entry menu after restart. |
| FR-6.3 | Each entry shall be one Markdown file with YAML front matter, and the entry's page shall show all scenes that mention it. | Open a character; the list of linked scenes equals a text search for its wiki-links. |
| FR-6.4 | Opening an entry from the editor shall take one action (click or shortcut) and open it in the other pane. | From a scene, open a character in the second pane in one step. |
| FR-7.1 | The timeline shall show events on a time axis with one lane per plotline or character, and events shall be created from scenes or from the timeline itself. | Create an event from a scene; it appears in the correct lane and date. |
| FR-7.2 | Dates shall support real calendars and custom calendars (invented months, years and eras) defined in `inkwell.yml`. | Define a calendar with 10 months; events sort and display correctly. |
| FR-7.3 | The app shall compute character ages from their birth event and show them at any timeline point. | A character born in year 1860 shows age 24 on an event in 1884. |
| FR-7.4 | The app shall flag continuity conflicts: a character in two places at one time, or appearing in a scene before their first-appearance date. | A seeded test project produces each of the two warnings; a clean project produces none. |
| FR-8.1 | Typing `@` in the editor shall open a fuzzy-search list of lore entries and insert a wiki-link on selection. | Type `@mi`; "Mira Vance" is offered and `[[mira-vance\|Mira]]` is inserted. |
| FR-8.2 | Hovering or pressing a shortcut on a tag shall show a pop-over with the entry's key fields, with an option to open it in the side pane. | The pop-over appears in under 150 ms for a 300-entry lore base. |
| FR-8.3 | Renaming a lore entry shall update every link to it across the project, and a deleted target shall be shown as a broken link. | Rename an entry used in 40 scenes; all 40 links resolve. |
| FR-9.1 | A node graph shall show lore entries as nodes and their relationships as labelled edges, built from front matter. | Graph edges equal the relationship entries in the files. |
| FR-9.2 | Users shall filter the graph by entry type, faction or relationship type, pan and zoom, and open an entry by selecting its node. | Filter to "rivals"; only rival edges remain; clicking a node opens its profile. |
| FR-9.3 | The graph shall stay usable with 300 nodes and 1,000 edges. | Pan and zoom stay above 30 frames per second at that size. |

## Version control and developer features (F10 to F13)

| ID | Requirement | Acceptance criterion |
| --- | --- | --- |
| FR-10.1 | Creating a project shall initialize a Git repository without requiring Git to be installed; opening an existing repository shall work unchanged. | Fresh machine without Git: create a project and see history entries. |
| FR-10.2 | The app shall commit automatically on a configurable interval (default 10 minutes) and on close, with generated messages. | After 25 minutes of editing, at least 2 autosave commits exist. |
| FR-10.3 | Users shall create, switch, compare and merge named branches ("what-if" plotlines). Switching shall first save uncommitted work. | Branch, edit a scene, switch back: both versions are intact. |
| FR-10.4 | A diff view shall show word-level changes in prose between any two points in history or branches. | Diff of two versions highlights exactly the inserted and deleted words. |
| FR-10.5 | Merge conflicts shall be resolved in a visual side-by-side view and shall never leave conflict markers in a scene file. | A conflicting merge ends with clean files after resolution. |
| FR-10.6 | Users shall roll back a scene or the whole project to any earlier point, and the rollback itself shall be recorded in history. | Roll back, then roll forward again using history. |
| FR-11.1 | "Take snapshot" (button or shortcut) shall save the current scene with an optional note in under 200 ms for a 5,000-word scene. | Timed test on a 5,000-word scene. |
| FR-11.2 | Snapshots shall be listed per scene, diffable against the current text and restorable in one action. | Take 3 snapshots, restore the first, and the text matches it exactly. |
| FR-11.3 | Snapshots shall not appear in the normal branch history. | The main branch log is identical before and after taking snapshots. |
| FR-12.1 | All project content shall be stored as UTF-8 Markdown, YAML or JSON files readable without Inkwell. | Open a project folder in a plain text editor; every scene is readable. |
| FR-12.2 | The editor shall support CommonMark, YAML front matter, footnotes, wiki-links and scene-break markers; raw and live-preview views shall be switchable per pane. | Toggle views on a document using each syntax. |
| FR-12.3 | Search shall support plain, whole-word, case-sensitive and regular-expression modes across the whole project. | A regex search for `\bgr[ae]y\b` returns all matches in a 300k-word project in under 1 s. |
| FR-13.1 | Ctrl+P or Cmd+K shall open a command palette that fuzzy-searches commands, scenes, lore entries and themes, and runs the chosen item. | Jump to "Chapter 12" using only the keyboard. |
| FR-13.2 | Every command shall have a rebindable shortcut, stored in a user keybindings file; conflicts shall be reported. | Rebind a key; the new binding works and a duplicate shows a warning. |
| FR-13.3 | Users shall record and save macros as ordered lists of commands and run them from the palette or a shortcut. | Record "snapshot, then set status to Revised"; running it does both. |
| FR-13.4 | Default shortcuts shall map Ctrl to Cmd on macOS. | The shortcut table is identical except for the modifier on macOS. |

## Productivity (F14 to F16)

| ID | Requirement | Acceptance criterion |
| --- | --- | --- |
| FR-14.1 | The app shall show live word counts for the current session, the current scene, the selected folder and the whole manuscript, counting prose only. | Add 100 words in front matter and comments: counts do not change. |
| FR-14.2 | Users shall set a session target, a per-scene target and a manuscript target, and see progress bars for each. | Set a 1,500-word session target; the bar reaches 100% at 1,500 words. |
| FR-14.3 | The user shall set a deadline and writing days per week; the app shall show the words per day needed to finish and update it daily. | 60,000 words remaining, 30 writing days left: the display shows 2,000 per day. |
| FR-14.4 | Session counts shall measure net new words and shall not be inflated by pasting from the same document or by undo and redo. | Cut and paste a 500-word block: session count changes by 0. |
| FR-15.1 | The dashboard shall show a calendar heatmap of words per day for the past 12 months. | Heatmap cell values equal the totals in the writing log. |
| FR-15.2 | The dashboard shall show charts for words per week, writing speed (words per active hour) and productivity by time of day. | Charts match figures computed independently from a test log. |
| FR-15.3 | The dashboard shall show current and longest daily streaks and progress toward the manuscript target. | A test log with a known 5-day gap yields the expected streaks. |
| FR-15.4 | Analytics shall be computed only from local files and shall be exportable as CSV. | Export, then recompute totals in a spreadsheet: they match. |
| FR-16.1 | A sprint timer shall run configurable work and break intervals (default 25 and 5 minutes) with visible and optional audible alerts. | A 25-minute sprint ends with an alert within 1 second of zero. |
| FR-16.2 | At the end of each sprint the app shall log duration, scene and net words written into the writing log and the dashboard. | After a sprint with 420 new words, the log and dashboard each show 420. |
| FR-16.3 | The timer shall be start, pause and stop controllable from the command palette and shall survive switching panes or modes. | Start in distraction-free mode, pause by shortcut, and resume. |

## Editing and quality assurance (F17 to F20)

| ID | Requirement | Acceptance criterion |
| --- | --- | --- |
| FR-17.1 | A background analyzer shall report overused words (frequency above a configurable threshold, excluding common stop words) for a scene, a folder or the manuscript. | A test text with "suddenly" 40 times flags it; a stop word does not appear. |
| FR-17.2 | The analyzer shall flag filler phrases and clichés from built-in lists that the author can extend or switch off in a project file. | Add a custom phrase; it is flagged in the next analysis. |
| FR-17.3 | The analyzer shall flag repeated sentence openers (for example 4 sentences in a row starting with the same word). | Seeded text produces the expected warning. |
| FR-17.4 | Findings shall appear as unobtrusive highlights in the editor and in a report panel, shall be dismissible per item, and shall never alter the text. | Dismiss a finding; it stays dismissed after restart; text is unchanged. |
| FR-17.5 | Analysis shall run off the typing path and shall not raise typing latency above the limit in NFR-1. | Typing latency benchmark runs with analyzer active. |
| FR-18.1 | Each scene shall have a POV field that accepts a lore character, chosen from a list, and optionally a POV type (first person, close third, omniscient). | Set POV on a scene; the front matter shows the character ID. |
| FR-18.2 | The tree, corkboard and timeline shall filter by one or more POV characters. | Filter by Mira: only her scenes remain in all three views. |
| FR-18.3 | The app shall report the number of scenes and words per POV character. | Report totals equal the sum of the filtered scene counts. |
| FR-19.1 | Status values shall default to Draft, Revised, Copyedited and Final and shall be editable by the user, each with a color. | Add "Needs research" in orange; it appears in all status menus. |
| FR-19.2 | Labels shall be separate from status, with user-defined names and colors, and shall show on tree items and cards. | A scene with status and label shows both on its card. |
| FR-19.3 | The user shall set status or label for many selected scenes at once and filter or search by them. | Select 20 scenes, set Revised, then filter by Revised: 20 results. |
| FR-20.1 | A glossary file shall hold rules, each with a pattern (plain or regular expression), a replacement or required form, and optional flags. | Create a rule that finds "gray" and requires "grey". |
| FR-20.2 | Each rule shall be scopable to dialogue only, narration only, one speaker or the whole text, where dialogue is text inside quotation marks. | A rule set to dialogue only ignores the same word in narration. |
| FR-20.3 | The engine shall find all violations, show them in a list, and apply replacements only after the user previews a full before-and-after diff. | Preview lists every change; cancel leaves all files unchanged. |
| FR-20.4 | Applying replacements shall take an automatic snapshot of every changed scene first and apply as one undoable operation. | After applying, one undo restores every scene. |

## Collaboration and export (F21 to F24)

| ID | Requirement | Acceptance criterion |
| --- | --- | --- |
| FR-21.1 | The compile engine shall output .docx, ePub 3 and print-ready PDF from the same source and preset. | Compile one project to all three; each opens without errors. |
| FR-21.2 | The user shall choose scope: whole manuscript, a folder, or scenes filtered by status, label or POV. | Compile only status Final; output contains exactly those scenes. |
| FR-21.3 | Compile shall strip comments and front matter, replace wiki-links with display text, and insert scene separators and chapter headings per the preset. | Output text contains no `[[`, no YAML and no comment text. |
| FR-21.4 | The .docx preset shall provide a standard manuscript layout (12 pt serif, double spacing, running header with title and page number) using named Word styles. | Open in Word: styles are named and editable; header shows page numbers. |
| FR-21.5 | The ePub output shall pass the standard ePub validator and contain metadata, a table of contents, cover and one file per chapter. | Validator reports no errors on a 120k-word test novel. |
| FR-21.6 | The PDF output shall allow trim size, margins, fonts, running heads and page numbers to be set, shall embed all fonts and shall control widows and orphans. | Preflight shows all fonts embedded; no single-line widows in a test chapter. |
| FR-21.7 | Compile of a 120,000-word manuscript shall finish in under 30 seconds per format and fail with a readable report if a required item is missing. | Timed test; remove the title and see the report. |
| FR-22.1 | Users shall attach comments to a selected piece of text; comments shall be stored in a sidecar file and never in the manuscript text. | Add a comment; the scene file's text is byte-identical before and after. |
| FR-22.2 | Comments shall have author, time, status (open or resolved) and replies, and shall stay attached to their text after nearby edits. | Edit text before and after the anchor; the comment stays on the same words. |
| FR-22.3 | A review panel shall list all comments with filtering by status, author and scene. | Filter to open comments from one author. |
| FR-22.4 | Comments shall never be included in compiled output unless the user enables a review export. | Default compile contains no comment text. |
| FR-23.1 | All writing shall go to local files first; the app shall be fully usable with sync off or the network down. | Disconnect the network: all features except sync work. |
| FR-23.2 | When sync is on, all content leaving the device shall be encrypted on the device using a key the storage provider never receives. | Inspect uploaded objects: no plaintext titles or text appear. |
| FR-23.3 | Two devices edited offline shall converge after sync with no lost text; conflicting edits to one scene shall be kept as two snapshots and flagged. | Simulated 3-device test with random edits ends with all text present. |
| FR-23.4 | Setup shall create a recovery key shown once, and a new device shall join using the passphrase or recovery key. | Add a second device with the passphrase and read the project. |
| FR-23.5 | Version 1 shall support a folder target, S3-compatible storage and WebDAV, and show sync status and last sync time. | Sync through each adapter in the test matrix. |
| FR-24.1 | The app shall ship themes: light, warm sepia, dark, true black and high contrast, and follow the system light or dark setting when chosen. | Switch the OS theme; the app follows within 1 second. |
| FR-24.2 | Every color in the interface, editor, graphs and charts shall come from theme tokens so a theme change updates all of them without restart. | Switch themes with all view types open; none keeps old colors. |
| FR-24.3 | Users shall create custom themes as plain JSON or CSS files and select editor font, size, line height and column width. | Drop a theme file in the config folder; it is listed and works. |
| FR-24.4 | Text and controls shall meet a contrast ratio of at least 4.5 to 1 in all built-in themes (7 to 1 in high contrast). | Automated contrast check passes for every theme. |

## Non-functional requirements

Measured on a reference machine of 4 CPU cores, 8 GB RAM and an SSD, using a generated 300,000-word, 1,000-scene test project. The PRD lists these as proposed targets to confirm with the client.

| ID | Category | Requirement | Measure |
| --- | --- | --- | --- |
| NFR-1 | Performance | Typing latency shall be under 16 ms at the 95th percentile, including with analyzer and sync running. | Automated keystroke benchmark |
| NFR-2 | Performance | Opening any scene shall take under 100 ms; cold start of a 100,000-word project under 2 s. | Timed test |
| NFR-3 | Performance | Idle memory shall stay under 400 MB with the test project open. | Process memory sampling |
| NFR-4 | Performance | A first full index of the test project shall finish in under 20 s in the background without blocking editing. | Timed test with typing running |
| NFR-5 | Reliability | No confirmed data loss: saves shall be atomic, and a forced kill during typing shall lose at most the last 1 second of input. | Crash-injection test, 1,000 runs |
| NFR-6 | Reliability | If the search cache is deleted or corrupt, the app shall rebuild it from files with no loss of information. | Delete cache; compare rebuilt index to the original |
| NFR-7 | Reliability | External edits to an open file shall be detected within 2 s and never silently overwritten. | Edit the file in another editor |
| NFR-8 | Security | The app shall make no network connections unless sync or updates are enabled. | Network capture during a full test session |
| NFR-9 | Security | Encryption shall use XChaCha20-Poly1305 with keys derived by Argon2id; keys shall be stored only in the OS secure store. | Code review and key-storage inspection |
| NFR-10 | Privacy | The app shall send no analytics or telemetry. | Network capture; source review |
| NFR-11 | Usability | Every function shall be reachable without a mouse; all built-in themes shall meet the contrast limits in FR-24.4. | Keyboard-only test script; contrast check |
| NFR-12 | Portability | The same project folder shall open and behave identically on Windows, macOS and Linux, including file names, line endings and Unicode text. | Cross-OS round-trip test |
| NFR-13 | Portability | Installers shall be provided for Windows 10 and later, macOS 11 and later, and mainstream Linux (AppImage, .deb, .rpm, Flatpak), each under 100 MB. | Build artifacts checked in CI |
| NFR-14 | Maintainability | The on-disk format shall carry a version number, and every format change shall ship with an automatic, backed-up migration. | Migration test from each earlier version |
| NFR-15 | Localization | The text engine shall handle all Unicode scripts, including right-to-left text, and use the OS spellcheck dictionaries. | Sample documents in 5 scripts |

## Interfaces and data formats

| Interface | Specification |
| --- | --- |
| Project files | UTF-8 Markdown with YAML front matter; folder metadata in `_folder.yml`; settings in `inkwell.yml`; comments in `.comments.json`; writing log in monthly `.jsonl` files; line endings stored as LF |
| Links | Wiki-link syntax `[[entry-id\|display text]]` resolved by stable IDs |
| Version control | Standard Git repository readable by any Git client; snapshots on `refs/inkwell/snapshots/*` |
| Compile outputs | .docx (Office Open XML), ePub 3, PDF; optional plain Markdown bundle |
| Sync | Encrypted chunks and manifest over a folder, S3-compatible or WebDAV adapter |
| Command line (optional) | `inkwell compile` and `inkwell lint` for scripted builds |
| User configuration | `keybindings.json`, theme files and macro files in the OS user config folder |
| Import | Plain Markdown, plain text and .docx files split into scenes at headings or scene breaks |

The on-disk format is documented in a separate file format specification, versioned with `format_version` in `inkwell.yml`.

## Constraints and assumptions

**Constraints**

- One codebase must serve Windows, macOS and Linux; no platform-only features in version 1.
- Data must stay in open, human-readable formats; no proprietary container.
- The app must work fully offline; network features are opt-in.
- No AI-generated text or cloud processing of manuscript content.

**Assumptions to confirm with the client**

- A single author owns each project; editors use the comment layer, not live co-editing.
- A typical project is under 300,000 words and 1,000 scenes.
- The author is comfortable with Git terms in advanced settings but prefers plain wording in the main interface.
- The author's operating systems have the minimum versions in NFR-13.
- Phase durations in the PRD assume two developers and may change after the open questions are answered.

## Traceability matrix

Each feature maps to its release phase in the PRD, the module that implements it in the TRD, its requirements here, and how it is tested.

| Feature | Phase | TRD module | Requirements | Main test level |
| --- | --- | --- | --- | --- |
| F1 Document tree | 1 | Project files, views | FR-1.1 to 1.4 | Unit, end to end |
| F2 Corkboard | 2 | Views | FR-2.1 to 2.4 | End to end |
| F3 Split screen | 1 | Editor | FR-3.1 to 3.3 | End to end |
| F4 Distraction-free | 1 | Editor | FR-4.1 to 4.3 | End to end on 3 OS |
| F5 Focus mode | 1 | Editor | FR-5.1 to 5.3 | Unit, performance |
| F6 Lore profiles | 2 | Project files, index | FR-6.1 to 6.4 | Unit, end to end |
| F7 Timelines | 2 | Views, index | FR-7.1 to 7.4 | Unit, seeded continuity tests |
| F8 Smart tags | 2 | Editor, index | FR-8.1 to 8.3 | Unit, end to end |
| F9 Relationship map | 2 | Views, project files | FR-9.1 to 9.3 | Performance, end to end |
| F10 Git version control | 3 | Version control | FR-10.1 to 10.6 | Unit, property tests |
| F11 Snapshots | 1 | Version control | FR-11.1 to 11.3 | Unit, performance |
| F12 Markdown and search | 1 | Project files, index, editor | FR-12.1 to 12.3 | Unit, performance |
| F13 Command palette | 1 | Commands | FR-13.1 to 13.4 | Unit, end to end |
| F14 Word count targets | 1 | Index, writing stats | FR-14.1 to 14.4 | Unit |
| F15 Analytics dashboard | 4 | Writing stats, views | FR-15.1 to 15.4 | Unit, golden data |
| F16 Pomodoro timer | 4 | Writing stats, commands | FR-16.1 to 16.3 | Unit, end to end |
| F17 Word and cliche analyzer | 4 | Analyzer | FR-17.1 to 17.5 | Unit, performance |
| F18 POV trackers | 2 | Index, views | FR-18.1 to 18.3 | Unit, end to end |
| F19 Status and labels | 1 | Project files, index | FR-19.1 to 19.3 | Unit, end to end |
| F20 Glossary engine | 3 | Index | FR-20.1 to 20.4 | Unit, property tests |
| F21 Compile engine | 3 | Compile | FR-21.1 to 21.7 | Golden files, validators |
| F22 Inline comments | 3 | Editor, project files | FR-22.1 to 22.4 | Unit, end to end |
| F23 Encrypted sync | 4 | Sync | FR-23.1 to 23.5 | Multi-device simulation |
| F24 Themes | 1 | Views, ui | FR-24.1 to 24.4 | Contrast checks, end to end |

## Acceptance and release criteria

A phase is released only when all of the following hold on Windows, macOS and Linux:

- Every requirement for that phase's features has passed its acceptance criterion; "Should" items may carry over with the client's agreement.
- All applicable non-functional requirements (NFR-1 to NFR-15) pass their measures on the reference machine.
- Installers build, install, launch and uninstall cleanly, and the app opens a project created on another operating system.
- There are no open defects that lose or corrupt text, and no open security findings above low severity.
- The author has completed a guided trial of the phase's user journeys from the PRD and signed off.
- The file format specification and user documentation are updated for any new or changed files.
