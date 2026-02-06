# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Metro Map Designer is an SVG-based web application for designing learning paths using a metro/subway line metaphor. Built for Smart Makers Academy. Licensed under GNU GPLv3.

## Development Setup

No build system or bundler — the app uses **ES6 modules loaded directly by the browser**. To develop:

1. Serve the project root with any static HTTP server (e.g., `python3 -m http.server`, VS Code Live Server)
2. Open `index.html` in a browser

There are no npm scripts, no test runner, no linter configured. All dependencies are loaded from CDNs (Bootstrap 5.3.7, Font Awesome 6.4.0, i18next 25.3.2, DOMPurify 3.2.6).

**Cache busting**: All local JS imports use `?v=1.0.5` query parameters. When changing file structure or after significant changes, update the version in `index.html` (`<meta name="app-version">`) and in all import paths.

## Architecture

### Entry Flow

`index.html` → loads `sources/application.js` as ES module → `loadInterface()` on window load → creates `MetroMapDesigner` instance → initializes UI modules.

All exported functions from interface modules are attached to `window` for use by inline HTML event handlers (onclick attributes in index.html).

### Core Layer (`sources/metromapdesigner/`)

- **MetroMapDesigner.js** — Main orchestrator class. Manages tools, mouse/touch event handling, state, and coordinates all other classes. Singleton-like: one instance stored in `application.js`.
- **classes/metromap.js** — Map container logic (largest file, ~2200 lines). Manages SVG layers, stations, metrolines, grid, drawing operations, and spatial queries.
- **classes/station.js** — Station class. Handles station SVG rendering, properties (name, type, shape, orientation), and visual updates.
- **classes/metroline.js** — Metroline class. Manages polyline points, color, drawing, and segment operations.
- **classes/legenda.js** — Legend component. Syncs legend items with metrolines, manages legend stations.
- **classes/importexport.js** — Serialization/deserialization. SVG and JSON import/export, backend communication for sharing.
- **classes/stateManager.js** — Undo/redo with configurable stack size (default 30). Uses hooks pattern for state change notifications.
- **common.js** — Helper functions: geometry calculations, SVG element creation, text measurement, `SpatialGrid` class for O(1) segment lookup.
- **config.js** — All configuration: colors, tool settings, canvas sizes, station defaults, visual config, backend URLs, SVG sanitization allowlists.

### Interface Layer (`sources/interfacemodules/`)

- **uifunctions.js** — Alerts/toasts, clipboard, zoom controls, i18n setup
- **toolbar.js** — Tool selection, color button generation
- **stationeditor.js** — Station property editor panel
- **exportfunctions.js** — PNG/SVG/JSON export, share URL generation
- **uploadhandlers.js** — File upload handling with validation (5MB SVG, 10MB JSON)

### SVG Layer Structure

The map SVG has ordered layers: `gridLayer` → `metrolines` → `stations` → `overlay` → `legenda` → `legendaStations` → title/academy text elements.

### State Management Pattern

`stateManager` uses a hooks/observer pattern. Other modules register callbacks via `addHook(event, callback)` for `save` and `revert` events. State is serialized as the full SVG content of the map.

### Backend Integration

The app communicates with `tools.smartmakersacademy.nl/sma_backend/` for:
- `POST /uploadMetroMap` — Save a map and receive a share code
- `GET /retrieveMetroMap?code=X` — Load a shared map

Share codes are passed via URL parameter `mc` (SVG) or `json` (JSON format).

## Key Conventions

- **SVG namespace**: All SVG elements must be created with `createElementNS("http://www.w3.org/2000/svg", ...)` — helper `createSVGElement()` in common.js handles this.
- **Security**: All imported SVG content is sanitized via DOMPurify with tag/attribute allowlists defined in `config.js`. Never use innerHTML for user content.
- **Station types**: `w` (werkplaats/workshop), `x` (excursie), `e` (experience), `o` (online), `*` (wildcard). Displayed as a letter badge on the station.
- **Station shapes**: `normal`, `start`, `end`, `connection` — each has different visual rendering.
- **Grid snapping**: Coordinates snap to `gridConfig.size` (10px) grid.
- **i18n**: Translation keys prefixed with `i18n_`, locale files in `locales/`. Five languages: nl, en, de, fr, es. Default is Dutch (nl).
- **Custom SVG attributes**: Stations and lines use custom attributes (`stationshapesize`, `stationshapeorientation`, `metrolineid`, etc.) that must be preserved during import/export.
