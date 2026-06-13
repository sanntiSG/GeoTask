# GeoTask

Recordatorios inteligentes por geolocalización. Te avisa cuando llegás al lugar exacto, sin que tengas que recordar abrir la app.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite + GSAP + Leaflet |
| Backend | Express + TypeScript + MongoDB + Mongoose |
| Auth | Google OAuth 2.0 + JWT (httpOnly cookies) |
| Push | Web Push API + VAPID keys |
| Mapas | Leaflet + OpenStreetMap + Photon API (sin API key) |
| Estado | Zustand + React Query |
| Deploy | Netlify (frontend) + Render (backend) + MongoDB Atlas |

## Setup rápido

### Prerequisitos
- Node.js 20+
- Cuenta Google Cloud (OAuth)
- MongoDB Atlas (free tier)
- Cuenta Render (free tier)
- Cuenta Netlify

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Completar todas las variables en .env
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Completar VITE_API_URL y VITE_VAPID_PUBLIC_KEY
npm run dev
```

## Variables de entorno

### Backend (.env)
```
MONGODB_URI=           # MongoDB Atlas connection string
JWT_SECRET=            # openssl rand -base64 64
JWT_REFRESH_SECRET=    # openssl rand -base64 64
GOOGLE_CLIENT_ID=      # Google Cloud Console
GOOGLE_CLIENT_SECRET=  # Google Cloud Console
GOOGLE_CALLBACK_URL=   # https://tu-backend.onrender.com/api/auth/google/callback
ADMIN_EMAIL=           # ssantii200@gmail.com
FRONTEND_URL=          # https://tu-app.netlify.app
VAPID_PUBLIC_KEY=      # npx web-push generate-vapid-keys
VAPID_PRIVATE_KEY=     # npx web-push generate-vapid-keys
VAPID_SUBJECT=         # mailto:ssantii200@gmail.com
COOKIE_SECRET=         # openssl rand -base64 32
```

### Frontend (.env)
```
VITE_API_URL=           # https://tu-backend.onrender.com
VITE_VAPID_PUBLIC_KEY=  # Igual que VAPID_PUBLIC_KEY del backend
```

## Generar VAPID keys

```bash
npx web-push generate-vapid-keys
```

## Arquitectura

```
geotask/
├── frontend/          # React PWA
│   └── src/
│       ├── services/  # Geolocation, Notifications, Storage (interfaces genéricas)
│       ├── hooks/     # useAuth, useGeolocation, useTasks, useLocations
│       ├── stores/    # Zustand (auth, app)
│       └── pages/     # Login, Onboarding, Home, Tasks, Map, Trajectory, Settings, Admin
├── backend/           # Express API
│   └── src/
│       ├── models/    # User, Task, Location, Trajectory, PushSubscription
│       ├── routes/    # auth, tasks, locations, trajectory, notifications, position, admin
│       └── services/  # push, proximity (cron cada 60s)
└── capacitor.config.ts  # Referencia para migración nativa
```

## Migración a App Nativa

El proyecto está diseñado para escalar a React Native (Expo) o Capacitor con mínimos cambios:

| Web (actual) | Nativo (futuro) |
|---|---|
| `geolocationService` | `@capacitor/geolocation` |
| `notificationService` | `@capacitor/push-notifications` |
| `storage.service` | `@capacitor/preferences` |
| Service Worker | APNs / FCM nativos |
| Leaflet | Mantener WebView o usar `react-native-maps` |

Toda la lógica de negocio está en `hooks/` y `services/` — los componentes no tienen acceso directo a Web APIs. Ver `capacitor.config.ts` para naming conventions.

## Deploy

### Render (Backend)
1. Conectar repo GitHub
2. Build command: `cd backend && npm install && npm run build`
3. Start command: `cd backend && npm start`
4. Agregar todas las env vars

### Netlify (Frontend)
1. Conectar repo GitHub
2. Base directory: `frontend`
3. Build command: `npm run build`
4. Publish directory: `frontend/dist`
5. Agregar env vars

## Seguridad

- JWT (15min) + Refresh Tokens (7 días) en httpOnly cookies
- CORS estricto: solo dominio Netlify en producción
- Rate limiting en todas las rutas
- Helmet.js para headers de seguridad
- Sanitización de inputs con express-validator
- Datos de ubicación nunca se loggean en producción
