# CRK Kingdom Editor

A web-based planning tool to design and preview your **Cookie Run: Kingdom** layout before building it in-game.
Build your dream layout, place decorations, and export your creation as an image

---

## Demo

Create your own at:

## Features

* Grid-based kingdom planning system
* Place decorations and buildings on a virtual map
* Drag & drop positioning
* Snap-to-grid alignment for precision
* Collision detection (no overlapping objects)
* Save and load layouts locally
* Export layout as image (PNG)
* Reset / clear board


---

## Tech Stack

* **Frontend**: React + TypeScript (Vite)
* **Database**: PostgreSQL (Adminer)
- **Rendering Engine:** PixiJS
* **UI Library**: Chakra UI
* **State Management**: Zustand

---

## Installation

### Option 1 — Dockerized startup (recommended)

```bash
# Clone the repository
git clone https://github.com/naila-bon/crk-kingdom-editor

# Go into the project
cd crk-kingdom-editor

# Create the environment file (if needed)
cp .env.example .env

# Start the full stack
npm run docker:dev

# Or run the script directly
./script/start
```

This starts:
- the Vite app on http://localhost:5173
- PostgreSQL on http://localhost:5432
- Adminer on http://localhost:8080

### Option 2 — Local startup

```bash
# Install dependencies
npm install

# Start only the database
npm run db:up

# Load data
npm run db:import -- --file ./scripts/crk_decors_avec_noms_843.json --table crk_decors

# Run frontend locally
npm run dev
```

---

## Project Structure

```
src/
│
├── scripts/
│
├── components/
│
├── store/
│
└── assets/
```

---

## Core Concepts

### Grid System

The editor is based on a tile grid system.
Each item snaps to the nearest tile to ensure alignment.

###  Drag & Drop

Items are draggable using `react-konva`, with position updates handled on drag end.

###  Collision Detection

Prevents overlapping items using bounding box checks.

###  Export System

The canvas is exported as an image using:

```ts
stageRef.current.toDataURL()
```

---

##  Data Management

* Items are stored in a local JSON file (`items.json`)
* User layouts are saved in **localStorage**
* Future improvements may include backend persistence

## PostgreSQL Import

This repository now includes a small PostgreSQL import path for JSON data.

1. Start PostgreSQL:

```bash
npm run db:up
```

2. Copy `.env.example` to `.env` and adjust the connection values if needed.

3. Import a JSON file into the default `imported_json` table:

```bash
npm run db:import -- --file ./data.json
```

If the file contains an array, each element becomes one row. If the file contains a single object, it is stored as one row. The original JSON is kept in a `JSONB` column so the structure stays flexible.

## Database UI

Adminer is available once the Docker services are running:

```bash
docker compose up -d
```

Open http://localhost:8080 and use these connection settings:

* System: PostgreSQL
* Server: postgres
* Username: postgres
* Password: postgres
* Database: crk_kingdom

---

##  Roadmap

* [ ] Zoom & pan canvas
* [ ] Undo / Redo system
* [ ] Multi-select items
* [ ] Item rotation
* [ ] Layer system (background / decorations)
* [ ] Shareable kingdom via URL
* [ ] Mobile support

---

##  Disclaimer

This project is a fan-made tool and is not affiliated with
**Devsisters** or **Cookie Run: Kingdom**.

All assets belong to their respective owners.

