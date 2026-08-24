# CRK Kingdom Editor

CRK Kingdom Editor is a browser-based layout planner for **Cookie Run: Kingdom**. Place decorations on a kingdom map, align them to the grid, move them precisely, and export your design as an image.

Try the live application on [GitHub Pages](https://naila-bon.github.io/crk-kingdom-editor/).

## Features

- Browse and search the decoration catalogue
- Place, move, and remove decorations on a grid
- Snap decorations to valid grid positions
- Prevent invalid placement and overlapping objects
- Pan and zoom the map
- Undo and redo edits
- Save layouts locally in the browser
- Export the layout as a PNG image

## Tech Stack

- **Frontend:** React, TypeScript, and Vite
- **Canvas rendering:** PixiJS
- **UI:** Chakra UI
- **State management:** Zustand
- **Deployment:** GitHub Pages through GitHub Actions
- **Database tooling (planned):** PostgreSQL and Adminer

## Project Structure

```text
src/
├── assets/       # Map and decoration assets
├── components/   # Editor UI and Pixi canvas components
├── hooks/        # Reusable React hooks
├── store/        # Kingdom editor state
├── types/        # TypeScript domain types
└── utils/        # Grid and texture helpers
scripts/          # Database and JSON import scripts
public/           # Static public assets
```

## Disclaimer

This is a fan-made tool and is not affiliated with **Devsisters** or **Cookie Run: Kingdom**. Game names, images, and other assets belong to their respective owners.
