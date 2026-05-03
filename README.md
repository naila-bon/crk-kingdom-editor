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
* **Canvas Engine**: react-konva (Konva.js)
* **UI Library**: Chakra UI
* **State Management**: Zustand

---

## Installation

```bash
# Clone the repository
git clone https://github.com/naila-bon/crk-kingdom-editor

# Go into the project
cd crk-kingdom-editor

# Install dependencies
npm install

# Run dev server
npm run dev
```

---

## Project Structure

```
src/
 ├── components/
 │    ├── Canvas/
 │    ├── Toolbar/
 │    ├── ItemPicker/
 │
 ├── store/
 │    └── useEditorStore.ts
 │
 ├── data/
 │    └── items.json
 │
 ├── utils/
 │    ├── grid.ts
 │    ├── collision.ts
 │    └── export.ts
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

