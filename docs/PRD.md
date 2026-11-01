# Inkwell: Product Requirements Document (PRD)

Oct 31, 2026 · @drxtr0men

Inkwell is a local-first, plain-text novel-writing studio for Windows, Linux and macOS that combines Scrivener-style structure, Obsidian-style lore linking and Git-grade version control.

## Problem and vision

A novelist today has to pick between structure, lore and safety. Word processors have none of the three. Manuscript tools give structure but often keep text in proprietary containers. Note tools give linked lore but no manuscript, no compile and no word-count discipline.

Inkwell closes that gap for one author: the manuscript is a folder of plain Markdown files, the story bible is linked to the prose, and every change is recoverable through Git. The product promise is that the writer's words stay readable by any tool, on any operating system, for decades.

## Target user

The primary user is one professional novelist writing long-form fiction (80,000 to 200,000 words per book, often a multi-book series). He is comfortable with developer tools such as Git, Markdown, regex and keyboard-driven workflows, and writes on more than one computer.

Jobs he needs done:

- Restructure a manuscript freely without losing track of continuity.
- Keep a large cast, many places and invented lore consistent.
- Draft daily with measurable progress and no distractions.
- Try alternate plotlines safely and roll back.
- Deliver clean .docx, ePub or PDF files to editors, agents and stores.

Secondary users are editors and beta readers who leave comments. Real-time multi-author editing is out of scope for version 1.

## Goals, non-goals and success metrics

**Goals**

- Never lose or lock in the author's text.
- Make a 300,000-word manuscript feel as fast as a 3,000-word note.
- Replace separate tools for drafting, lore, timelines, analytics and export.
- Run identically on Windows, Linux and macOS.

**Non-goals for version 1**

- AI text generation or rewriting.
- Real-time multi-author collaboration.
- A web or mobile client (the file format and sync design keep the door open).
- Screenplay or academic formatting.

**Proposed success metrics** (targets to confirm with the client)

| Metric | Target |
| --- | --- |
| Typing latency, 300k-word project | under 16 ms at the 95th percentile |
| Open any scene | under 100 ms |
| Cold start, 100k-word project | under 2 s |
| Compile a 120k-word novel to .docx, ePub or PDF | under 30 s |
| Idle memory use | under 400 MB |
| Installer size | under 100 MB |
| Content readable without the app | 100% (plain Markdown and YAML) |
| Confirmed text-loss defects | 0 |

## Feature scope

All 24 requested features are in scope. Priority uses Must, Should, Could; phase numbers match the release plan below. Detailed requirements are in the SRD, keyed by the same feature number (F1 to F24).

| # | Feature | Priority | Phase | Why the author needs it |
| --- | --- | --- | --- | --- |
| F1 | Multi-level document tree | Must | 1 | Acts, chapters, scenes and sub-scenes in one nested structure |
| F2 | Corkboard / index cards | Must | 2 | Restructure the book by dragging scene summaries |
| F3 | Split-screen editor | Must | 1 | Write beside character notes or the outline |
| F4 | Distraction-free mode | Must | 1 | Full-screen, text only |
| F5 | Focus mode | Should | 1 | Dim everything except the current sentence or paragraph |
| F6 | Character and location profiles | Must | 2 | One source of truth for traits, arcs and settings |
| F7 | Dynamic story timelines | Should | 2 | Catch continuity errors across plots and ages |
| F8 | Inline smart tagging (@mentions) | Must | 2 | Open any profile without leaving the scene |
| F9 | Relationship mapping | Could | 2 | See who connects to whom at a glance |
| F10 | Git-backed version control | Must | 3 | Diff, branch for what-if plots, roll back safely |
| F11 | Granular scene snapshots | Must | 1 | Save a scene before a risky rewrite |
| F12 | Markdown / multi-syntax support | Must | 1 | Open, portable files that regex can search |
| F13 | Custom shortcuts and command palette | Should | 1 | Keyboard-only navigation and macros |
| F14 | Word count targets | Must | 1 | Session, manuscript and deadline counters |
| F15 | Writing analytics dashboard | Could | 4 | Heatmaps and trends on writing habits |
| F16 | Pomodoro sprint timer | Should | 4 | Timed sprints with logged word output |
| F17 | Word frequency and cliché analyzer | Should | 4 | Flag overused words and filler in the background |
| F18 | Perspective (POV) trackers | Must | 2 | Filter the manuscript by point-of-view character |
| F19 | Status and label trackers | Must | 1 | Draft, Revised, Copyedited, Final at a glance |
| F20 | Global dialogue / terminology glossary | Should | 3 | Context-aware find-and-replace for invented dialects |
| F21 | Multi-format compile engine | Must | 3 | Industry-ready .docx, ePub and print PDF |
| F22 | Inline comments and reviewing | Should | 3 | Notes and editor feedback kept out of the prose |
| F23 | Local-first encrypted cloud sync | Should | 4 | Write offline, continue on another device |
| F24 | Dark mode and themes | Must | 1 | High-contrast, sepia and true dark for late sessions |

## Release plan

Delivery runs in four phases, each ending in something the author can use daily. Durations are planning estimates for a two-developer team and need confirming.

1. **Phase 1, Write (about 10 weeks).** Project folder, document tree, editor, split view, distraction-free and focus modes, themes, command palette, status labels, snapshots, word counters (F1, F3, F4, F5, F11, F12, F13, F14, F19, F24). Exit: the author drafts and reorganizes a full chapter in Inkwell and can recover any earlier scene version.
2. **Phase 2, Structure and lore (about 8 weeks).** Corkboard, character and location profiles, @mentions, POV tracking, timelines, relationship graph (F2, F6, F7, F8, F9, F18). Exit: a 100-scene test novel can be filtered by POV and checked on the timeline.
3. **Phase 3, Ship it (about 8 weeks).** Git integration and branches, compile engine, inline comments, glossary engine (F10, F20, F21, F22). Exit: a full manuscript compiles to .docx, ePub and PDF that pass the checks in the SRD.
4. **Phase 4, Insight and sync (about 8 weeks).** Analytics dashboard, Pomodoro timer, cliché analyzer, encrypted sync (F15, F16, F17, F23). Exit: two devices stay in sync offline-first with no lost edits across the test matrix.

## Platform and distribution

One codebase ships as a native desktop app on all three systems. The app works fully offline, needs no account, and never uploads text unless the author turns on sync.

| System | Proposed minimum | Installer | Notes |
| --- | --- | --- | --- |
| Windows | Windows 10 (x64, arm64) | .msi and .exe installer | Uses the system WebView2 runtime |
| macOS | macOS 11 (Apple silicon and Intel) | Universal .dmg | Signed and notarized |
| Linux | Ubuntu 22.04 or equivalent (x64, arm64) | AppImage, .deb, .rpm, Flatpak | Needs the system WebKitGTK library, except in the AppImage and Flatpak |

Cross-platform requirements: identical keyboard shortcuts with Ctrl on Windows and Linux mapped to Cmd on macOS, full Unicode text, OS spellcheck dictionaries, system light and dark theme detection, and project folders that open unchanged on any of the three systems.

## Key user journeys

**A writing day.** The author opens the project, presses the command shortcut, jumps to Chapter 12, Scene 3 and sets a 1,500-word session target. He enters distraction-free mode with focus mode on, writes, types @Stella to check her eye colour in a pop-over, and stops when the progress bar fills. The scene status moves from Draft to Revised.

**A plot rewrite.** Before changing the villain's reveal, he takes a snapshot of the scene, creates a "reveal-in-act-2" branch, and drags cards on the corkboard to reorder four scenes. The timeline flags that a character is now present before he is introduced. He compares the branch against the main plotline and merges or discards it.

**A submission.** He filters scenes by status Final, runs the glossary check for the invented dialect, then compiles a manuscript .docx for an agent and an ePub for proofreading. Editor feedback arrives as inline comments that never appear in the compiled output.

## Risks and open questions

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Editor slows down on 300k-word projects | High | Load one scene at a time, index in the background, benchmark every release |
| Git concepts overwhelm a non-developer user | Medium | Friendly labels ("snapshot", "what-if branch"), Git details optional |
| Sync conflicts lose text | High | Conflicts never overwrite; both versions kept as snapshots |
| Compile output rejected by agents or stores | Medium | Validate against standard manuscript layout and ePub checks before release |
| Linux packaging fragmentation | Medium | Ship AppImage and Flatpak first, test on Ubuntu, Fedora and Arch |

**Open questions for the client**

- [ ] Is the author the only user, or will editors need their own copy with comment access?
- [ ] Which cloud storage should sync support first (own server, S3-compatible, Dropbox, Google Drive)?
- [ ] Which manuscript layout should the .docx follow (for example standard agent submission format) and which print trim sizes are needed?
- [ ] How large is the biggest planned project (words, characters, locations)?
- [ ] Is "Inkwell" acceptable as the working product name?
