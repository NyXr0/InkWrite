# InxWrite

<p align="center">
  <strong>The Novelist’s Studio & Personal eBook Reading Sanctuary</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Web%20Application-orange?style=flat-square" alt="Platform" />
  <img src="https://img.shields.io/badge/Engine-React%2018%20%7C%20TypeScript%20%7C%20Vite-blue?style=flat-square" alt="Stack" />
  <img src="https://img.shields.io/badge/Storage-Local%20First%20(IndexedDB)-emerald?style=flat-square" alt="Storage" />
  <img src="https://img.shields.io/badge/License-MIT-purple?style=flat-square" alt="License" />
</p>

---

## 📖 Overview

**InxWrite** is a local-first, distraction-free modern web environment tailored for novelists, screenwriters, worldbuilders, and avid readers. InxWrite bridges the gap between deep creative manuscript composition and immersive book reading by dividing the application into two integrated pillars accessible from the primary landing view:

```
┌────────────────────────────────────────────────────────────────────────┐
│  InxWrite                    [1st: Writer Mode | 2nd: Reading Library] │
├───────────────────────────────────┬────────────────────────────────────┤
│   Part 1: Novel Studio            │   Part 2: eBook Reading Library    │
│   ────────────────────            │   ─────────────────────────────    │
│   • Multi-level Manuscript Binder │   • EPUB, PDF, TXT & MD Bookshelf  │
│   • CodeMirror 6 Prose Editor     │   • 1-Page & Dual-Page Book Spread │
│   • MS Word Style Margin Ruler    │   • Arrow-Key Page Turning         │
│   • Interconnected Story Codex    │   • Table of Contents & Bookmarks  │
│   • Anti-Hallucination Canon Web  │   • Text-to-Speech (TTS) Reader    │
│   • Corkboard & Timeline Lanes    │   • Custom Local Font Importer     │
│   • Snapshots, Comments & Sprints │   • Reading Progress Tracking      │
└───────────────────────────────────┴────────────────────────────────────┘
```

---

## ✨ Key Features

### ✍️ Part 1: Novel Writing Studio (Writer Mode)

#### 1. Manuscript Binder & Scene Outliner
* **Hierarchical Tree Structure**: Organize novel manuscripts into Volumes, Acts, Chapters, and Scenes with unlimited nesting depth.
* **Drag-and-Drop Reordering**: Intuitively rearrange scenes and folders in real time.
* **Scene Status Lifecycle**: Track progress with visual color pins (`Idea`, `First Draft`, `Second Draft`, `Revised`, `Final`).
* **Metadata at a Glance**: Scene point-of-view (POV), word target progress indicators, synopsis cards, and scene locations.

#### 2. Distraction-Free Pro Editor
* **CodeMirror 6 Engine**: Built specifically for long-form prose with smooth scrolling and high-fidelity text rendering.
* **Interactive Margin Ruler**: An MS Word-style visual ruler with draggable left, right, and first-line indentation markers.
* **Split-Screen Mode**: Compare reference scenes, worldbuilding notes, or earlier revisions side-by-side with live sync.
* **Fullscreen Focus Mode**: Strip away UI clutter for pure, typewriter-style immersion.
* **Revision Snapshots**: Capture timestamped snapshots before major edits and restore any revision with 1 click.
* **In-Line Review Comments**: Anchor editorial comments to specific text highlights with resolution status.
* **Live Autocomplete**: Type `@` to reference characters and lore or `[[slug|Name]]` to create inline wiki links.

#### 3. Interconnected Codex & Story Bible (Anti-Hallucination Knowledge Graph)
InxWrite differentiates 5 dedicated story element categories to ensure the author and system maintain continuity without contradictions:

| Category | Color & Icon | Dedicated Attributes & Scope |
| :--- | :--- | :--- |
| **Character** | Terracotta (`User`) | **Only character details**: Archetype/Role, Vital Status, Species/Age, Occupation, Core Motivation, Fatal Flaw, Physical Appearance, Mannerisms & Voice. |
| **Location** | Emerald (`MapPin`) | **Only location details**: Classification (Realm, City, Dungeon), Controlling Authority, Climate & Atmosphere, Sensory Impressions, Demographics, Customs & Laws, Landmarks, Hazards. |
| **Lore & Worldbuilding** | Gold (`Sparkles`) | **Lore and world explanation**: Magic Systems, Cosmology, Historical Eras, Governing Axioms, Costs & Dangers, Known Keepers, World Impact. |
| **Item & Artifact** | Cyan (`Package`) | **Items and artifacts in the world**: Classification (Relic, Weapon, Tome), Rarity Tier, Current Bearer/Location, Creator/Forging Lore, Abilities, Requirements/Curse. |
| **Faction & Order** | Violet (`Shield`) | **Faction and order setup**: Organization Type, Core Creed & Motto, Leadership Hierarchy, Headquarters, Heraldry Sigil, Military/Economic Reach, Allies & Enemies. |

* **Obsidian-Style Interactive Node Graph View**:
  - Full-screen force-directed 2D physics simulation of your entire story universe.
  - Dynamically scaled node radiuses reflecting connection degree with category-themed color palettes.
  - Seamless pan, zoom (mouse wheel or camera buttons), and drag-and-drop node physics.
  - Luminous halo focus with automatic neighbor highlighting (dims unrelated nodes for laser-focused cluster inspection).
  - Floating glassmorphic Node Inspector HUD with quick connections and 1-click **"Open Dossier"** and **"+ Link"** tools.
  - Dedicated **Bottom Ribbon Navigation** inside the Codex (`[ 📋 Element Dossiers | 🕸️ Obsidian Node Graph | 🎯 Local Subgraph ]`).
* **Bidirectional Cross-Linking**: Automatically tracks outgoing links and computes incoming backlinks (inverted index) with 1-click navigation between related entities.
* **Manuscript Reality Scanner**: Scans all scenes in real time for mentions of names, aliases, or POV/setting anchors, showing match context snippets and a direct **"Open Scene in Editor"** button.
* **Canonical Timeline Anchors**: Links events from your story timeline to entities, locking in chronological continuity.
* **Continuity Status Bar**: Live verification metric showing connected entities, scene occurrences, and timeline milestones.

#### 4. Narrative Visual Corkboard
* Card-based view of scenes grouped by chapter.
* Edit synopsis summaries, inspect status badges, and adjust pacing visually.

#### 5. Chronological Story Timeline
* Multi-lane timeline tracking character arcs, subplots, and world events concurrently.
* Conflict and pacing warnings alerting you to continuity overlap.

#### 6. Writing Insights & Sprint Engine
* Live sprint countdown timer with words-per-minute logging.
* Daily writing targets, streak counters, and deadline forecast graphs.

#### 7. Project Hub & Exporting
* Export complete manuscript to **Markdown (.md)**, **Plain Text (.txt)**, or formatted HTML.
* Full JSON project backups with 1-click restore.

#### 8. Interactive App Tutorial & Onboarding Guide
* **7-Step Guided Tour**: Visual walkthrough explaining the twin pillars, binder outliner, editor margin ruler, Obsidian node graph, corkboard, eBook spread reader, and focus mode.
* **Instant Revisit Button**: Reopen the tutorial anytime via the **🎓 Tutorial** button in the Top Navigation Bar, start screen, settings, or Command Palette (`Ctrl+K`).
* **Keyboard Friendly**: Navigate steps with `Left Arrow` / `Right Arrow` and dismiss with `Esc`.

---

### 📚 Part 2: Personal Reading Library (Reader Mode)

The Reading Library operates directly from the landing window, allowing you to read books without needing to open a writing project first:

* **Universal eBook Support**: Import and read **EPUB**, **PDF**, **TXT**, and **Markdown (.md)** files with local parsing.
* **Dual-Page Spread Mode**: Read books side-by-side in a realistic open-book layout.
* **Single-Page & Continuous Scroll Modes**: Switch between classic pagination and vertical scrolling.
* **Arrow-Key Navigation**: Flip forward with `Right Arrow` and backward with `Left Arrow`.
* **Integrated Text-to-Speech (TTS)**: Built-in speech synthesis with play, pause, pitch, and rate control.
* **Table of Contents (TOC)**: Hierarchical chapter drawer with instant jump points.
* **Bookmarks & Progress**: Automatic progress tracking in IndexedDB; pick up right where you left off.
* **Custom Typography**: Select standard or custom imported local fonts (`.ttf`, `.woff`, `.otf`), tune line height, letter spacing, and margins.

---

## 🎨 Themes & Ergonomics

InxWrite is built with high-contrast, eye-friendly palettes designed for marathon writing and reading sessions:

* 📜 **Paper**: Clean, crisp parchment optimized for daytime drafting.
* ☕ **Sepia**: Warm, low-contrast tone easing eyestrain during prolonged writing.
* 🌙 **Night**: Deep charcoal/slate dark theme for night owls and low-light environments.
* 🖤 **OLED High-Contrast**: True black mode maximizing contrast on OLED displays.

---

## ⌨️ Essential Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + K` / `Cmd + K` | Open Universal Command Palette |
| `Ctrl + Shift + L` | Quick-switch to Reading Library |
| `Ctrl + S` | Force Project Save to Local Storage |
| `Ctrl + Shift + F` | Enter / Exit Distraction-Free Focus Mode |
| `Ctrl + Enter` | Create a New Scene in Active Chapter |
| `Left Arrow` / `Right Arrow` | Previous / Next Page (Reading Mode & Tutorial) |
| `@` (in Editor) | Open Lore & Character Mention Autocomplete |
| `Esc` | Dismiss modals, popups, or exit Focus Mode |

---

## 🛠️ Technology Stack

* **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Build System**: [Vite](https://vitejs.dev/)
* **Editor Core**: [CodeMirror 6](https://codemirror.net/) with custom Markdown extensions
* **Document & eBook Parsers**:
  * [epubjs](https://github.com/futurepress/epub.js) for EPUB parsing
  * [pdfjs-dist](https://github.com/mozilla/pdf.js) for PDF document rendering
  * [JSZip](https://stuk.github.io/jszip/) for archive handling
* **Icons**: [Lucide React](https://lucide.dev/)
* **Storage**: Local-First client-side persistence using **IndexedDB** & **LocalStorage** (Zero telemetry, zero cloud lock-in, fully offline).

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (version 18+ recommended)
* `npm` or `pnpm`

### Installation & Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/NyXr0/InkWell.git InxWrite
   cd InxWrite
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

4. **Build for production:**
   ```bash
   npm run build
   ```
   The compiled static assets will be output to the `dist/` directory.

5. **Preview the production build:**
   ```bash
   npm run preview
   ```

---

## 📂 Project Architecture

```
InxWrite/
├── src/
│   ├── components/
│   │   ├── binder/         # Manuscript Binder tree outliner
│   │   ├── codex/          # Codex & Lore Bible views, modals, and Obsidian node graph
│   │   ├── corkboard/      # Visual Corkboard scene index cards
│   │   ├── editor/         # CodeMirror 6 editor, margin ruler, split view
│   │   ├── export/         # Manuscript compiler and HTML/TXT/MD export
│   │   ├── focus/          # Fullscreen distraction-free typewriter mode
│   │   ├── insights/       # Word sprint engines, velocity targets & metrics
│   │   ├── inspector/      # Right-hand scene metadata, comments & snapshots
│   │   ├── layout/         # Top navigation bar, status bar, and mode switches
│   │   ├── library/        # Bookshelf gallery and eBook reader integration
│   │   ├── palette/        # Command palette (Ctrl+K)
│   │   ├── project/        # Primary Landing page & Writer/Library switcher
│   │   ├── reading/        # Reading Mode, Dual-Page spread, and PDF viewer
│   │   ├── settings/       # Appearance, themes, and custom font importer
│   │   ├── timeline/       # Multi-lane chronological narrative timeline
│   │   └── ui/             # Modals, sliders, toolbars, and buttons
│   ├── core/
│   │   ├── appearanceStorage.ts   # Persistent theme and typography configuration
│   │   ├── bookLibraryStorage.ts  # IndexedDB engine for personal eBooks
│   │   ├── codexSchema.ts         # Schema, field definitions & templates for Codex
│   │   ├── customFontStorage.ts   # IndexedDB custom typography and FontFace loader
│   │   ├── epubParser.ts          # EPUB format unzipper and DOM parser
│   │   ├── sampleData.ts          # Default starter manuscript and story elements
│   │   ├── storage.ts             # Project persistence, backups & migration
│   │   └── textBookParser.ts      # Plain text & Markdown chapter detector
│   ├── types/
│   │   ├── appearance.ts   # Typography, themes, and styling types
│   │   ├── book.ts         # eBook formats, chapters, and bookmarks types
│   │   └── project.ts      # Manuscript, Scene, Lore, and Timeline schema
│   ├── App.tsx             # Root application component and mode router
│   └── main.tsx            # Application entrypoint
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🔒 Privacy & Data Ownership

InxWrite is built on the philosophy of **complete data sovereignty**:
* **100% Client-Side**: Your manuscripts, lore bibles, and imported books stay on your device inside your browser's IndexedDB.
* **No Telemetry**: No tracking scripts, analytics, or external data transmission.
* **Full Backups**: Export your projects to JSON backups or compiled manuscripts anytime with a single click.

---

## 📄 License

This project is open-source software licensed under the [MIT License](LICENSE).
