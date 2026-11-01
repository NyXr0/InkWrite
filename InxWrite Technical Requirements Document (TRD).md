# Inkwell: Technical Requirements Document (TRD)

Oct 31, 2026 · @drxtr0men

Inkwell is a Tauri desktop app: a Rust core owns files, Git, search, compile and sync, a TypeScript front end built on CodeMirror 6 owns editing and the visual views, and a plain Markdown project folder is the single source of truth.

## Key technical decisions

Each choice below serves three constraints: one codebase on Windows, Linux and macOS, plain-text data the author owns, and fast editing on very large manuscripts.

| Area | Decision | Why | Fallback |
| --- | --- | --- | --- |
| App shell | Tauri 2 (Rust core, system WebView) | Small installers and low memory; Rust suits Git, crypto and compile work | Electron if WebKitGTK on Linux proves unreliable |
| Front end | TypeScript, React, Vite | Mature ecosystem for drag-and-drop, graphs and charts | Svelte |
| Editor | CodeMirror 6 | Plain-text Markdown model, custom decorations, regex search, handles large documents | ProseMirror (rich-text model) |
| Source of truth | Folder of .md and .yml files | Portable, greppable, Git-friendly | None |
| Index and search | SQLite with FTS5, rebuilt from files | Fast queries; disposable cache, never the master copy | None |
| Version control | Embedded libgit2 via the git2 crate | No separate Git install; real branches and diffs | Shell out to system git |
| Compile | pulldown-cmark, docx-rs, epub-builder, embedded Typst for PDF | One Rust pipeline, no external runtime | Optional Pandoc export path |
| Sync | Encrypted replication of the Git object store | Reuses Git's merge model; provider-agnostic | Plain Git remote for advanced users |
| Encryption | Argon2id key derivation, XChaCha20-Poly1305 | Modern, audited primitives (RustCrypto) | age format |
| Graphs and charts | Cytoscape.js for relationships, D3 for charts and heatmaps | Proven, themeable, run offline | Sigma.js |

## Architecture at a glance

&#91;embedded content: architecture · 3 layers, 16 parts\]

Read top to bottom: the interface asks, the Rust core acts, and plain files stay the master copy. The search cache can be deleted and rebuilt, and the cloud copy is optional and encrypted.

## Project folder and data model

A project is an ordinary folder. Every scene, profile and note is a Markdown file with YAML front matter, so any editor, `grep` or script can read it. Order lives in small folder files, and every item carries a permanent ID so renames and moves never break links.

```text
my-novel/
  inkwell.yml                 project settings, statuses, labels, targets, compile presets
  manuscript/
    act-1/
      _folder.yml             title, summary, order of children
      ch-01/
        _folder.yml
        opening.md            one scene
        opening.comments.json review comments for that scene
  lore/
    characters/  locations/  factions/  items/   one .md file per entry
  timeline/events.yml         dated events and lanes
  stats/2026-10.jsonl         append-only writing log
  glossary/rules.yml          terminology and dialogue rules
  .inkwell/                   cache.db, device id, logs (git-ignored)
```

A scene file looks like this:

```yaml
---
id: 0192f3a4-7c1e-7b52-9d10-5a3e8c2f4b61
title: The Arrival
summary: Mira reaches the harbor and meets Calder.
status: draft
label: subplot-a
pov: mira-vance
locations: [harbor-town]
story_time: 1884-03-02T06:00
word_target: 2500
---
The ferry slid into the harbor...
```

Rules that every module follows:

- **IDs.** Every file has a UUIDv7 `id`; links use the ID, so moving a file is safe.
- **Smart tags.** Typing `@` offers matching lore entries and inserts a standard wiki-link such as `[[mira-vance|Mira]]`. Obsidian reads the same syntax, and compile replaces it with the display text.
- **Relationships.** Each profile lists edges in front matter, for example `relationships: [{to: calder-rook, type: rival}]`; the graph view is built from these.
- **Comments.** Reviewer notes live in a sidecar `.comments.json` file anchored by quoted text plus offsets, so they never enter the manuscript text or the compiled output.
- **Unknown fields are preserved.** Inkwell never deletes front matter keys it does not recognize.
- **Ordering.** The `order` list in `_folder.yml` is authoritative; an optional setting prefixes file names with numbers for tools that sort alphabetically.

## Core modules

The Rust core is split into crates with one job each; the front end talks to them only through typed Tauri commands and events.

| Module | Responsibility | Key libraries | Features |
| --- | --- | --- | --- |
| inkwell-project | Read and write project files, atomic saves, file watching, front matter | serde\_yaml, notify | F1, F12, F19 |
| inkwell-index | SQLite index, full-text and regex search, word counts, link graph | rusqlite (FTS5), regex | F6, F8, F14, F18, F20 |
| inkwell-vcs | Commits, branches, diffs, scene snapshots, rollback | git2 | F10, F11 |
| inkwell-compile | Scene selection, Markdown to document model, DOCX, ePub, PDF | pulldown-cmark, docx-rs, epub-builder, typst | F21 |
| inkwell-sync | Encrypted object replication, key management, conflict handling | RustCrypto, argon2, keyring, object\_store | F23 |
| inkwell-analyze | Word frequency, cliché and filler detection, sentence-opener repetition | unicode-segmentation | F17 |
| inkwell-stats | Writing log, sprint records, daily-target math | serde\_json | F14, F15, F16 |
| front end: editor | CodeMirror 6 setup, decorations, split panes, focus mode | CodeMirror 6 | F3, F4, F5, F8, F12, F22 |
| front end: views | Tree, corkboard, timeline, relationship graph, dashboard, themes | dnd-kit, Cytoscape.js, D3 | F1, F2, F7, F9, F15, F24 |
| front end: commands | Command registry, palette, keymaps, macros | custom | F13, F16 |

## Editor engine

One scene is one CodeMirror document, usually under 5,000 words, so typing stays fast regardless of book length. A whole-chapter continuous view loads scenes lazily.

- **Split screen (F3).** A pane manager holds two editor panes. Each pane can show a scene, a lore profile or the outline. If both show the same file, they share one editor state so edits appear in both.
- **Distraction-free mode (F4).** A layout flag hides every chrome element, centers a column of configurable width and optionally hides the OS clock by going native fullscreen. A single shortcut or Escape exits.
- **Focus mode (F5).** A view plugin finds the active sentence (using `Intl.Segmenter`) or paragraph and adds a dimming decoration to the rest. Typewriter scrolling keeps the caret line steady.
- **Inline smart tags (F8).** An `@` completion source queries the index. A decoration turns each wiki-link into a chip; hover or a shortcut opens the profile in a pop-over or the second pane.
- **Comments layer (F22).** Comment anchors are decorations computed from the sidecar file, re-anchored after edits by matching quoted text. They are excluded from word counts and compile output.
- **Command palette (F13).** Every action is a registered command with an ID, title and default key. The palette (Ctrl+P or Cmd+K) fuzzy-searches commands, scenes and themes. Users override keys in `keybindings.json`. Macros are saved sequences of command IDs with arguments.
- **Themes (F24).** All colors are CSS variables. Built-in themes: light, warm sepia, dark, true black and high contrast. Custom themes are plain JSON or CSS files in the user config folder. The editor, graphs and charts all read the same variables.
- **Markdown and syntax (F12).** CommonMark plus YAML front matter, footnotes and a small set of Inkwell extensions (scene breaks, wiki-links). Raw and live-preview rendering can be toggled per pane.

## Index, search and analytics data

The SQLite database in `.inkwell/cache.db` is a cache. If it is deleted or corrupt, Inkwell rebuilds it from the files; nothing exists only in the database.

- **Tables.** `documents` (ID, path, kind, title, status, label, POV, word count, content hash, modified time), `links` (source, target, kind), `events` (timeline), `comments`, and an FTS5 virtual table for full text.
- **Incremental updates.** A file watcher re-parses only files whose hash changed. A first index of a 300,000-word project must finish in the background in under 20 seconds without blocking the editor.
- **Search.** Plain, whole-word, case and regex modes. Regex runs over files with the Rust `regex` engine; FTS5 narrows candidates first when the query allows it.
- **Filters.** The tree, corkboard and timeline are all queries over the same index (by status, label, POV, character or location), which is how POV filtering (F18) and status filtering (F19) work everywhere.
- **Writing log (F14, F15, F16).** The editor appends one JSON line per save with timestamp, scene ID and net word delta; sprints add start, end and words written. Files are monthly (`stats/YYYY-MM.jsonl`), append-only and tracked by Git, so they sync and merge without conflicts. Heatmaps and trend charts are computed from them on demand.
- **Word counts.** Counted on prose only: front matter, comments and Markdown syntax are excluded. Targets (session, per scene, manuscript, daily deadline) are stored in `inkwell.yml`; the daily figure is remaining words divided by remaining writing days.

## Version control and snapshots

Git is the engine, but the interface speaks the author's language: snapshots, what-if branches and restore.

- **Repository.** Creating a project runs `git init` through libgit2; no system Git is required. An existing repository is adopted as is.
- **Autosave commits.** Saves are debounced to about one second. Work is committed on the current branch on a timer (default every 10 minutes) and on app close, with generated messages, so history is dense but never needs author attention.
- **Scene snapshots (F11).** "Take snapshot" writes a commit holding only that scene on a hidden ref, `refs/inkwell/snapshots/<scene-id>/<time>`, with an optional note. Snapshots stay out of normal branch history, show in a per-scene list, and can be diffed against the current text or restored in one click.
- **What-if branches (F10).** Branches are ordinary Git branches with friendly names. Before switching, Inkwell snapshots uncommitted changes. A branch compare view shows scene-level and word-level diffs; merging uses Git's three-way merge with a visual resolver for conflicts.
- **Diff.** Word-level diff for prose (via the `similar` crate), line diff for metadata.
- **Safety.** Restore and branch switch never discard uncommitted text; they commit it first. Every destructive action is reversible from history.
- **Advanced.** A project may set a normal Git remote. Optional, off by default.

## Compile engine

Compile turns a chosen part of the project into a finished file. It is deterministic: the same inputs and preset always produce the same output.

1. **Select.** The author picks a preset and a scope (whole manuscript, a folder, or a filter such as status Final or one POV).
2. **Resolve.** Walk the tree in order, drop comments and metadata, replace wiki-links with display text, apply scene separators and chapter numbering, add front and back matter from templates.
3. **Parse.** Convert Markdown to an intermediate document model (headings, paragraphs, emphasis, breaks, footnotes) with pulldown-cmark.
4. **Render.** Three renderers consume the same model:
   - **DOCX:** docx-rs with a standard manuscript preset (12 pt serif, double spacing, running header, scene-break marker) and named Word styles so editors can restyle.
   - **ePub 3:** epub-builder with one file per chapter, navigation document, metadata, cover and embedded fonts.
   - **PDF:** embedded Typst templates with trim size, margins, running heads, widow and orphan control and embedded fonts for print.
5. **Verify.** Fail with a readable report if a link is unresolved, a required metadata field is missing or a font cannot be embedded.

Presets are YAML files in the project, so they sync and version with the manuscript. Pandoc can be added later as an optional extra export path; it is not required.

## Local-first encrypted sync

Writing never waits on the network: every save goes to local files first, and sync runs in the background when the author has turned it on. Sync copies the project's Git history, not loose files, so merging reuses Git's model.

1. **Per-device history.** Each device commits to its own ref, `refs/inkwell/devices/<device-id>`, so devices never overwrite each other's history.
2. **Upload.** New Git objects are packed, split into chunks, encrypted with XChaCha20-Poly1305 using a fresh nonce per chunk and a key derived from the master key, and stored under random content-hash names. An encrypted manifest lists the current refs and is replaced with a conditional write.
3. **Download.** A device fetches the manifest, downloads missing chunks, decrypts them and imports the objects into its local repository.
4. **Integrate.** If one device's work is a fast-forward of another's, it moves forward. Otherwise Git performs a three-way merge per file.
5. **Conflicts.** Prose is never overwritten and never filled with conflict markers. Both versions are saved as snapshots, the scene is flagged, and the author resolves it in a side-by-side view.

**Keys and storage**

- A random 256-bit master key encrypts all data. A passphrase, run through Argon2id, wraps that key for new devices; a recovery key is shown once at setup.
- The unwrapped key is kept in the operating system's secure store: Keychain on macOS, Credential Manager on Windows, Secret Service on Linux.
- The storage provider sees only random object names, sizes and timing, never titles or text.
- Version 1 adapters: a local or network folder (works with any file-sync client), S3-compatible storage and WebDAV. OAuth providers such as Dropbox and Google Drive follow as separate adapters behind the same interface.

## Cross-platform build, packaging and updates

One CI pipeline builds all targets from the same commit. A release is published only when every platform job and the end-to-end tests pass.

| Target | Runner | Artifacts | Signing |
| --- | --- | --- | --- |
| Windows x64 and arm64 | Windows | .msi, NSIS .exe | Code-signing certificate on every installer |
| macOS universal (Apple silicon + Intel) | macOS | .dmg, .app | Developer ID signature and Apple notarization |
| Linux x64 and arm64 | Ubuntu 22.04 containers | AppImage, .deb, .rpm, Flatpak | Detached GPG signatures; Flatpak through its own repository |

- **Toolchain.** Rust stable, Node LTS, pnpm, Tauri CLI. Dependencies are pinned by lock files and audited in CI (`cargo audit`, `pnpm audit`).
- **Updates.** Opt-in updater with signed update manifests. The app never updates in the middle of a writing session and never needs a network to run.
- **Platform differences handled in one layer.** Paths, keychain access, fullscreen behavior, file-watcher backends and shortcut mapping (Ctrl to Cmd) sit behind a small `platform` module so the rest of the code is identical on all systems.
- **Rendering consistency.** The UI uses only web features available in WebView2, WKWebView and WebKitGTK; fonts for editor and compile output are bundled rather than taken from the system.

## Performance, security and reliability

**Performance design**

- Open one scene at a time; the tree, corkboard and timeline are virtualized so only visible items render.
- Heavy work (indexing, analysis, compile, sync) runs in Rust background tasks or Web Workers and reports progress; it never blocks typing.
- Analyzer results are cached per file hash, so only edited scenes are re-analyzed.

**Security**

- Offline by default: no telemetry, no network calls unless the author enables sync or updates.
- Strict content security policy; the front end can call only an allow-list of Tauri commands, and file access is confined to open project folders.
- Sync keys live in the OS secure store; nothing secret is written to the project folder.
- Imported or opened files are treated as data: front matter is parsed with a safe YAML loader and Markdown is never executed as code.

**Reliability**

- Crash-safe saves: write to a temporary file, flush to disk, then atomically rename over the original.
- External edits are detected by the file watcher; if a file changes on disk while open, Inkwell offers reload, keep mine or compare, and never overwrites silently.
- A rolling local backup (zip of the project) is kept on a schedule, separate from Git, so a damaged repository is still recoverable.
- The index can always be rebuilt from the files.

## Testing and quality gates

| Level | Tooling | What it proves |
| --- | --- | --- |
| Unit | cargo test, Vitest | Parsers, front matter, word counts, date math, command registry |
| Property and fuzz | proptest | Front matter round trips never lose unknown keys; saves never truncate text |
| Sync simulation | Multi-device test harness | Random offline edits on 3 devices converge with no lost text |
| Compile golden files | Snapshot tests, python-docx and ePub validators in CI | .docx, ePub and PDF output stays correct and stable |
| Performance | Generated 300k-word, 1,000-scene corpus, benchmark job | Latency, startup and memory targets in the SRD hold on every release |
| End to end | Playwright with tauri-driver on Windows, macOS and Linux | Real user flows work on all three systems |
| Accessibility | axe checks, keyboard-only test script | Full keyboard operation and sufficient contrast in every theme |

Quality gates for merging: all tests pass on three operating systems, no performance benchmark regresses more than 10%, and the dependency audit is clean.

## Repository layout

A single monorepo keeps the Rust core and the front end versioned together.

```text
inkwell/
  apps/
    desktop/                Tauri app: src-tauri (Rust shell) + src (TypeScript UI)
    cli/                    optional headless tool: inkwell compile, inkwell lint
  crates/
    inkwell-project/        files, front matter, watcher, atomic saves
    inkwell-index/          SQLite index and search
    inkwell-vcs/            Git, snapshots, branches, diffs
    inkwell-compile/        compile pipeline and renderers
    inkwell-sync/           encryption, adapters, merge
    inkwell-analyze/        frequency, cliche and filler analysis
    inkwell-stats/          writing log and targets
  packages/
    editor/                 CodeMirror setup and extensions
    views/                  tree, corkboard, timeline, graph, dashboard
    ui/                     design tokens, themes, shared components
  docs/                     PRD, TRD, SRD, file format specification
  .github/workflows/        build, test and release pipelines
```

The file format specification in `docs/` is versioned separately. Any change to the on-disk format needs a migration and a bump of `format_version` in `inkwell.yml`.
