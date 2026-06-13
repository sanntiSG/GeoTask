# GeoTask

A full-stack location-based task manager built with Next.js 16, React 19, SQLite, and Leaflet maps.

## Features

- **Interactive map** — click anywhere on OpenStreetMap to drop a task pin
- **Task CRUD** — create, edit, complete, and delete tasks with title, description, category, priority, and alert radius
- **Categories** — work, personal, shopping, errand, other
- **Priority** — high (red), medium (amber), low (green) with color-coded map markers
- **Filtering & search** — filter by category, priority, and completion status; full-text search on title/description
- **Address autocomplete** — type an address in the task form to search via Photon (komoot); selecting a result auto-fills latitude and longitude
- **Proximity alerts** — uses the browser Geolocation API to watch your position; fires a browser notification when you are within a task's alert radius of an incomplete task

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Framework | Next.js 16 (App Router)           |
| UI        | React 19 + Tailwind CSS v4        |
| Maps      | Leaflet + react-leaflet            |
| Database  | SQLite via better-sqlite3          |
| Language  | TypeScript                        |

## Getting Started

```bash
npm install
cp .env.example .env.local   # optional — app works with defaults, no key needed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

All variables have safe defaults. The app starts with **no configuration** using free OpenStreetMap tiles.

Copy `.env.example` → `.env.local` and edit only the values you want to override. After any change restart `npm run dev`.

| Variable | Default | Description |
|---|---|---|
| `DATABASE_PATH` | `data/geotask.db` | SQLite file path (relative to project root) |
| `NEXT_PUBLIC_MAP_TILE_URL` | OSM tiles | Tile URL template `{z}/{x}/{y}` |
| `NEXT_PUBLIC_MAP_ATTRIBUTION` | OSM attribution | HTML attribution string shown on the map |
| `NEXT_PUBLIC_DEFAULT_LAT` | `-34.603` | Initial map center latitude |
| `NEXT_PUBLIC_DEFAULT_LNG` | `-58.381` | Initial map center longitude |
| `NEXT_PUBLIC_DEFAULT_ZOOM` | `12` | Initial map zoom level |
| `NEXT_PUBLIC_GEOCODE_LANG` | `en` | Language for address autocomplete suggestions (`en`/`de`/`fr`/`it`). **`es` is not supported by Photon and returns 400 errors.** |

### Using a commercial map provider

Uncomment one of the provider examples in `.env.local` and paste your API key. No code changes needed.

- **MapTiler** — sign up at [maptiler.com](https://www.maptiler.com), copy your key.
- **Stadia Maps** — sign up at [stadiamaps.com](https://stadiamaps.com), copy your API key.

## Permissions

- **Geolocation** — required for proximity alerts. The browser will prompt on first visit.
- **Notifications** — optional; used to surface nearby-task alerts. Falls back to a browser alert if denied.

Both require a secure context (`localhost` qualifies during development).

## API

| Method | Endpoint            | Description                                             |
|--------|---------------------|---------------------------------------------------------|
| GET    | `/api/tasks`        | List tasks (filter: category, priority, completed, q)   |
| POST   | `/api/tasks`        | Create a task                                           |
| GET    | `/api/tasks/:id`    | Get a single task                                       |
| PATCH  | `/api/tasks/:id`    | Update fields (including completed)                     |
| DELETE | `/api/tasks/:id`    | Delete a task                                           |

## Data

The SQLite database is stored at `data/geotask.db` (created automatically, gitignored).
