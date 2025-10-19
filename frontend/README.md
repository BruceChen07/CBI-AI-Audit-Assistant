# Frontend (Create React App)

This is the React frontend for the project, bootstrapped with Create React App (CRA). It provides the user interface, handles authentication, and communicates with the backend API.

## Features overview

- React app powered by CRA scripts (start/build/test).
- Centralized API wrapper with:
  - Base URL configuration via environment variable.
  - Automatic Authorization header injection (Bearer token).
  - Token pre-refresh when the token is near expiry, and 401 retry-once logic.
  - Automatic logout on persistent 401.
- Local authentication utilities:
  - Store token/role/username in localStorage.
  - Simple pub/sub auth change notifications.
- Admin Panel with tabs (Users, Settings, Metrics).

Relevant code files:
- <mcfile name="api.js" path="d:\Workspace\hackathon\frontend\src\utils\api.js"></mcfile>
- <mcfile name="auth.js" path="d:\Workspace\hackathon\frontend\src\utils\auth.js"></mcfile>
- <mcfile name="AdminPanel.js" path="d:\Workspace\hackathon\frontend\src\components\admin\AdminPanel.js"></mcfile>

## Prerequisites

- Node.js and npm installed.
- Backend service running (default assumed at http://localhost:8000 unless overridden).

## Install dependencies

```bash
npm install
```

## Development

Start the dev server (CRA defaults to http://localhost:3000):

```bash
npm start
```

The browser will auto-open. The page reloads on file changes. ESLint messages appear in the console.

## Build for production

Generate an optimized production bundle in the build folder:

```bash
npm run build
```

## Run tests

```bash
npm test
```

## Configuration

Environment variables are read at build time by CRA. Create a file named `.env` in this folder if you need to override defaults.

- REACT_APP_API_BASE_URL
  - Description: Backend API base URL used by the API wrapper.
  - Default: http://localhost:8000 (see <mcfile name="api.js" path="d:\Workspace\hackathon\frontend\src\utils\api.js"></mcfile>)
  - Example:
  
```bash
REACT_APP_API_BASE_URL=http://localhost:8000
```

- NODE_ENV
  - Used by CRA and logging. When `production`, the logger defaults to a higher log level (see <mcfile name="logger.js" path="d:\Workspace\hackathon\frontend\src\utils\logger.js"></mcfile>).

Note: If you change `.env`, restart the dev server to take effect.

## Authentication and API behavior

Implemented in <mcfile name="auth.js" path="d:\Workspace\hackathon\frontend\src\utils\auth.js"></mcfile> and <mcfile name="api.js" path="d:\Workspace\hackathon\frontend\src\utils\api.js"></mcfile>.

- Storage
  - Token, role, username persisted in localStorage.
  - Utility APIs: `saveAuth`, `logout`, `getToken`, `getRole`, `onAuthChange`.

- Requests
  - All requests go through `apiFetch(path, options, attachAuth = true)`.
  - Automatically attaches `Authorization: Bearer <token>` when available.
  - If the token will expire soon (default threshold 60s), a refresh is attempted once before issuing the request.
  - On 401 responses:
    - Tries to refresh once and then retries the original request.
    - If still unauthorized (or when refreshing itself fails), logs out and surfaces an error message.

- Refresh endpoint
  - The API wrapper calls `/auth/refresh` (on the configured base URL) to refresh JWT.
  - The new token is saved along with role/username extracted from the JWT payload.

## Admin Panel

See <mcfile name="AdminPanel.js" path="d:\Workspace\hackathon\frontend\src\components\admin\AdminPanel.js"></mcfile>.

- Tabs: Users, Settings, Metrics.
- Persists the last opened tab in `localStorage` under `admin_tab`.
- Shows a clear message when the current user is not authorized (not admin).

## Project structure (partial)

- `public/` — Static assets served by CRA (index.html, manifest, icons).
- `src/`
  - `components/` — UI components (including `components/admin`).
  - `hooks/` — Custom React hooks.
  - `utils/` — Utilities (API/auth/logger/file helpers).
  - `App.js` — App root component.
  - `index.js` — Entry point.

## Common issues and tips

- CORS
  - When the frontend and backend run on different origins, ensure CORS is enabled on the backend for the frontend origin.

- API base URL mismatch
  - If the frontend cannot reach the backend, set `REACT_APP_API_BASE_URL` accordingly and restart `npm start`.

- 401 loop or forced logout
  - Verify the backend implements `/auth/refresh` and that tokens are valid.
  - Check browser devtools Network tab for error details.

- Changing environment variables
  - CRA reads env vars at build/start time. Restart the dev server after changes to `.env`.

## Scripts

Available npm scripts from `package.json`:

- `start` — Start dev server.
- `build` — Build production bundle.
- `test` — Run tests.
- `eject` — Eject CRA config (irreversible; not recommended unless necessary).
