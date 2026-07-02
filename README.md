# BST Visualizer

Interactive Binary Search Tree visualizer for exploring insert, delete, search, and traversal operations with animated state changes.

## Two-Point Summary

- Provides a visual learning environment for BST operations, including tree layout updates, timeline playback, operation controls, and explanatory panels.
- Built with React, TypeScript, and Vite, with a small engine layer separating BST operation logic from UI rendering.

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **State/UI:** React state, modular components, CSS modules
- **Core logic:** Custom BST operation engine

## Features

- Insert values into a BST
- Delete nodes while visualizing structural changes
- Search for values in the tree
- Traverse the tree and inspect operation order
- Playback operation steps with a floating timeline/control bar
- Pseudocode and explanation panels
- Export/utility helpers for sharing or saving visual state

## Repository Structure

```text
src/engine/       BST insert, remove, search, and traversal logic
src/components/   Controls, viewport, timeline, inspector, and explanation panels
src/layout/       Tree layout computation
src/state/        Visualizer state management
src/styles/       Global styling
```

## Run Locally

```bash
npm install
npm run dev
```

The dev server is configured for Vite on port `5173`.

## Build

```bash
npm run build
npm run preview
```

## Project Notes

- The repository currently has a lowercase `read.me`; GitHub convention is `README.md`.
- Add this file as `README.md` so it renders automatically on the repository homepage.
