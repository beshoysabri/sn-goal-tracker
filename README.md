# Goal Tracker for Standard Notes

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Standard Notes](https://img.shields.io/badge/Standard%20Notes-Plugin-6366f1.svg)](https://standardnotes.com)

Track personal and professional goals across every dimension -- status, priority, deadlines, progress history, sub-tasks, and sub-goals -- all stored securely inside a Standard Notes note.

### Quick Install

Paste this URL in **Standard Notes > Preferences > Advanced Settings > Install Custom Plugin**:

```
https://beshoysabri.github.io/sn-goal-tracker/ext.json
```

### Highlights

- **4 Views** — List, Timeline (month/quarter/year/5-year), Board, Insights
- **Progress Tracking** — Boolean, percentage, numeric, and checklist tracking types
- **Life Areas** — Organize goals into color-coded categories (Health, Finance, Career, etc.)
- **Analytics** — Completion rates, velocity analysis, projected completion dates
- **Sub-Goals** — Full parent-child goal hierarchy with task checklists
- **Export** — CSV, Markdown, and PDF reports

---

## Table of Contents

- [Features](#features)
- [Views](#views)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Development](#development)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Data Format](#data-format)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Goal Management

- Create goals with a title, description, icon (50+ built-in), and color
- Set status: **Active**, **Completed**, **Paused**, or **Abandoned**
- Assign priority: Low, Medium, High, or Critical
- Organize goals under **Life Areas** -- custom categories with their own color and icon
- Build goal hierarchies with **sub-goals** (parent-child relationships)
- Archive goals to keep your workspace focused

### Progress Tracking

- Four tracking types: **Boolean** (done/not done), **Percentage**, **Numeric** (with custom units), and **Checklist**
- Log progress entries over time, each with an optional note
- Add tasks (sub-items) to any goal and mark them complete individually
- Set start dates, target dates, and completed dates

### Analytics and Insights

- Average completion percentage across all goals
- Counts for active, completed, paused, and overdue goals
- Per-life-area breakdown of progress
- Top progress goals, recently completed goals, and most-tracked goals
- Overdue goal highlighting
- Velocity analysis and projected completion dates

### Export

- **CSV** -- spreadsheet-ready tabular export
- **Markdown** -- portable plain-text format
- **PDF** -- formatted document export via jsPDF

### Standard Notes Integration

- Full theme support -- adapts to any SN theme including dark mode
- All data persists inside the SN note (no external server or database)
- Works on Desktop, Web, and Mobile
- Built-in debug panel for troubleshooting

---

## Views

| View | Description |
|------|-------------|
| **List** | Sortable goal list with status tabs and search. The default working view. |
| **Timeline** | Chronological layout with month, quarter, year, and 5-year scales. |
| **Board** | Kanban-style columns organized by goal status. Drag-friendly layout. |
| **Insights** | Analytics dashboard with charts, breakdowns, and progress statistics. |

---

## Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | React | 19 |
| Language | TypeScript | 5.9 |
| Build Tool | Vite | 7 |
| Charts | Recharts | 3 |
| PDF Export | jsPDF + jspdf-autotable | 2.5 / 3.8 |
| IDs | uuid | 13 |
| Linting | ESLint + typescript-eslint | 9 / 8 |

---

## Installation

### From the Install URL (recommended)

1. Open **Standard Notes** (desktop, web, or mobile).
2. Create a new note or open an existing one.
3. In the note editor, open **Extensions** (or **Editor**) and select **Import Extension**.
4. Paste the install URL:

   ```
   https://beshoysabri.github.io/sn-goal-tracker/ext.json
   ```

5. Activate the **Goal Tracker** editor on any note.

### From Source

1. Clone the repository:

   ```bash
   git clone https://github.com/beshoysabri/sn-goal-tracker.git
   cd sn-goal-tracker
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build:

   ```bash
   npm run build
   ```

4. Host the contents of `dist/` on any static file server and point Standard Notes to your `ext.json` URL.

---

## Development

### Prerequisites

- **Node.js** 22 or later
- **npm** 10 or later

### Setup

```bash
git clone https://github.com/beshoysabri/sn-goal-tracker.git
cd sn-goal-tracker
npm install
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite development server with hot reload |
| `npm run build` | Type-check with `tsc` and build for production |
| `npm run lint` | Run ESLint across the project |
| `npm run preview` | Preview the production build locally |

### Local Development with Standard Notes

1. Run `npm run dev` -- Vite will start on `http://localhost:5173` (or the next available port).
2. In `public/ext.dev.json`, the URL is already configured for local development.
3. Import `ext.dev.json` into Standard Notes using the local URL.
4. Changes will hot-reload in the editor.

---

## Deployment

This project uses **GitHub Actions** to deploy automatically to **GitHub Pages**.

### How It Works

1. Push to the `master` branch triggers the workflow.
2. The CI installs dependencies (`npm ci`), builds the project (`npm run build`), and deploys the `dist/` directory to the `gh-pages` branch.
3. GitHub Pages serves the built files, including `ext.json`, which Standard Notes reads to load the editor.

### Workflow Configuration

The deployment workflow lives at `.github/workflows/deploy.yml` and uses:

- `actions/checkout@v4`
- `actions/setup-node@v4` (Node.js 22)
- `peaceiris/actions-gh-pages@v4`

No manual deployment steps are required after the initial GitHub Pages setup.

---

## Project Structure

```
sn-goal-tracker/
├── public/
│   ├── ext.json              # SN extension manifest (production)
│   └── ext.dev.json          # SN extension manifest (local dev)
├── src/
│   ├── main.tsx              # Application entry point
│   ├── App.tsx               # Root component and SN bridge
│   ├── styles.css            # Global styles
│   ├── types/
│   │   └── goal.ts           # TypeScript interfaces and type definitions
│   ├── lib/
│   │   ├── sn-api.ts         # Standard Notes messaging API
│   │   ├── data.ts           # Data initialization and migration
│   │   ├── stats.ts          # Analytics and statistics calculations
│   │   ├── calendar.ts       # Date and timeline utilities
│   │   ├── colors.ts         # Color palette helpers
│   │   ├── icons.tsx         # Built-in icon library (50+)
│   │   ├── export-csv.ts     # CSV export logic
│   │   ├── export-md.ts      # Markdown export logic
│   │   └── export-pdf.ts     # PDF export logic
│   └── components/
│       ├── GoalTracker.tsx    # Main layout and state management
│       ├── Header.tsx         # Top bar with view switcher and actions
│       ├── GoalDetail.tsx     # Full goal detail / edit panel
│       ├── GoalModal.tsx      # Goal create / edit dialog
│       ├── GoalSidebar.tsx    # Side panel for quick goal view
│       ├── LifeAreaModal.tsx  # Life area create / edit dialog
│       ├── Setup.tsx          # First-run setup flow
│       ├── views/
│       │   ├── ListView.tsx       # List view
│       │   ├── TimelineView.tsx   # Timeline view
│       │   ├── BoardView.tsx      # Board (kanban) view
│       │   └── InsightsView.tsx   # Insights / analytics view
│       └── shared/
│           ├── Modal.tsx          # Reusable modal wrapper
│           ├── ConfirmDialog.tsx  # Confirmation prompt
│           ├── ColorPicker.tsx    # Color selection widget
│           ├── IconPicker.tsx     # Icon selection widget
│           ├── ExportMenu.tsx     # Export format picker
│           ├── ProgressBar.tsx    # Linear progress indicator
│           ├── ProgressCircle.tsx # Circular progress indicator
│           ├── ProgressChart.tsx  # Progress-over-time chart
│           ├── PriorityBadge.tsx  # Priority label component
│           ├── StatsCard.tsx      # Analytics stat card
│           ├── ShortcutsHelp.tsx  # Keyboard shortcuts overlay
│           └── Linkify.tsx        # Auto-link URLs in text
├── .github/
│   └── workflows/
│       └── deploy.yml         # GitHub Actions CI/CD pipeline
├── index.html                 # HTML entry point
├── vite.config.ts             # Vite build configuration
├── tsconfig.json              # TypeScript base config
├── tsconfig.app.json          # TypeScript app config
├── tsconfig.node.json         # TypeScript node config
├── eslint.config.js           # ESLint configuration
└── package.json
```

---

## Data Format

All goal data is stored as a single JSON object inside the Standard Notes note body. There is no external database or server. The top-level structure:

```jsonc
{
  "version": 1,
  "title": "My Goals",
  "goals": [ /* Goal objects */ ],
  "lifeAreas": [ /* LifeArea objects */ ],
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-06-15T12:00:00.000Z"
}
```

Each **Goal** contains fields for status, priority, tracking type, target/current values, dates, tasks, progress entries, and optional parent-goal and life-area references. See `src/types/goal.ts` for the complete schema.

Data is saved automatically whenever a change is made, using the Standard Notes component messaging API.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `1` | Switch to List view |
| `2` | Switch to Timeline view |
| `3` | Switch to Board view |
| `4` | Switch to Insights view |
| `N` | Create a new goal |
| `A` | Cycle through status tabs |
| `/` | Focus the search bar |
| `Enter` | Open selected goal detail |
| `Esc` | Close modal or panel |
| Arrow keys | Navigate between goals |
| `?` | Show keyboard shortcuts help |

---

## Contributing

Contributions are welcome. To get started:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/my-feature`).
3. Make your changes and ensure `npm run lint` and `npm run build` pass.
4. Commit with a clear message describing the change.
5. Open a pull request against `master`.

Please open an issue first for large changes or new features to discuss the approach.

---

## License

This project is licensed under the [MIT License](LICENSE).
