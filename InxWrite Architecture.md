Inkwell · technical architecture

# The manuscript is a folder of text files

Inkwell is a desktop app for Windows, macOS and Linux. A Rust core owns every read and write. A web interface draws the screen. Plain Markdown files hold the book, and everything else (search, history, sync) is built on top of them and can be thrown away and rebuilt.

## The system in one picture

Everything above the dashed line runs offline. The interface never touches the disk. It sends a command to the core, and the core is the only code that reads or writes the project folder.

## What happens when you type

The file is only ever replaced by a rename, so a power cut leaves either the old scene or the new one, never half of each. Search, word counts and Git history can lag behind without risk, because they are rebuilt from the files.

## How two devices stay in step

There is no Inkwell server to run or trust. Any Git host or shared folder works as the remote. When two devices edit the same scene, both versions are kept and the writer picks one.

## Rules the code must keep

- **Files are the truth.**Delete the SQLite cache and nothing is lost. It rebuilds from the folder on next launch.
- **Only the core touches disk.**The interface sends typed commands. It never opens a file, so a bug in a view cannot corrupt the manuscript.
- **One writer per file.**The core serialises saves. When the watcher sees an edit from another program, it reloads that scene instead of overwriting it.
- **Nothing leaves the machine in plain text.**The sync module only ever receives ciphertext from the crypto module, and keys stay in the OS keychain.
- **Each feature is a module.**Corkboard, timeline and compile each own their commands and screens, so one can change without touching the others.

## Decisions, and what we turned down

| Decision | Chosen | Turned down, and why |
| --- | --- | --- |
| Desktop shell | Tauri 2 with a Rust core | Electron: a much larger download and more memory for an app that sits open all day. Separate native apps: three codebases for one small team. |
| Source of truth | Folder of Markdown files | A database: the writer could not open the book in any other tool, and Git could not show a readable diff. |
| Editor | CodeMirror 6 | ProseMirror: richer, but it stores a document tree, which makes round-tripping to clean Markdown harder. |
| Version history | libgit2, snapshots on hidden refs | A custom snapshot store: we would rebuild diff and merge. Hidden refs keep snapshots out of the visible history. |
| Search | SQLite FTS5 cache | Scanning files on every query: fine at 10 scenes, slow at 500. |
| Sync | Encrypted chunks over Git | A hosted Inkwell server: it would have to be run, paid for and trusted with the manuscript. |
| Export | Rust libraries, Typst for PDF | Calling Pandoc: the writer would have to install it, and its version would vary between machines. |

## Where things live

### The source repository

```
inkwell/
  src-tauri/
    project/    files, tree, watcher
    index/      FTS5, links, counts
    versions/   git2, snapshots
    compile/    docx, ePub, PDF
    analytics/  sprints, streaks
    sync/       chunks, merge
    crypto/     keys, encryption
    ipc/        command + event types
  ui/
    editor/  binder/  codex/
    timeline/  insights/  compile/
    palette/  themes/
  docs/         PRD, TRD, SRD
```

### A writer's project folder

```
The Salt Road/
  inkwell.yml        targets, glossary, labels
  manuscript/
    _folder.yml      order of children
    01-departure/
      the-letter-arrives.md
      the-letter-arrives.comments.json
  codex/
    characters/  places/  lore/
  stats/
    2026-10.jsonl    one line per writing sprint
  .inkwell/
    cache.sqlite     ignored by Git, rebuildable
```

Each scene starts with a short YAML header holding a permanent id, status, POV and label. Links between scenes and codex entries use that id, so renaming a file never breaks a link. Fuller detail is in the [Technical Requirements Document](https://claude.ai/artifact/5WrAAD57zhmQmryZZniKKn).