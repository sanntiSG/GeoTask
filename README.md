# GeoTask

A full-stack location-based task manager built with Next.js 16, React 19, SQLite, and Leaflet maps.

## Features

- **Interactive map** — click anywhere on OpenStreetMap to drop a task pin
- **Task CRUD** — create, edit, complete, and delete tasks with title, description, category, priority, and alert radius
- **Categories** — work, personal, shopping, errand, other
- **Priority** — high (red), medium (amber), low (green) with color-coded map markers
- **Filtering & search** — filter by category, priority, and completion status; full-text search on title/description
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
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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
