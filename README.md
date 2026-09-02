# Grocery Agent

A mobile grocery app built with [Ionic](https://ionicframework.com/), Angular, and [Capacitor](https://capacitorjs.com/) — runs as a web app and packages to native iOS/Android. Lists are shared: create a list, share its code with others, and everyone sees changes live. Each list has two tabs: a **Shopping List** (what to buy) and an **Inventory** (what you already have, with quantity, weight, and expiry date, so you can see what's about to go bad).

## Stack

- Angular 20 (standalone components)
- Ionic Angular 9 (standalone components, `@ionic/angular`)
- Capacitor 8 for native shell + `@capacitor/preferences` to remember which list you're in
- `server/` — Node/Express + Postgres + Socket.IO API (see `server/README` section below), deployable to [Railway](https://railway.app/)

## Development server

Start the API first (see [Running the server locally](#running-the-server-locally)), then:

```bash
npm start
```

Open `http://localhost:4200/`. The app reloads automatically on source changes.

## Building

```bash
npm run build
```

Build output goes to `dist/grocery-agent/browser`, which is what `capacitor.config.ts` points to as the web asset directory.

## Running unit tests

```bash
npm test
```

## Adding native platforms

Native platform projects (`android/`, `ios/`) aren't included yet since this environment has no Android/iOS SDKs. To add them locally, once the SDKs are installed:

```bash
npm run build
npx cap add android
npx cap add ios
npx cap sync
```

Then open the native project with `npx cap open android` / `npx cap open ios` to build and run on a device or simulator.

## Backend (`server/`)

The app talks to a small API for shared, synced grocery lists:

**Shopping list**
- `POST /api/lists` — create a list, returns a share code (e.g. `VRB8LD`)
- `GET /api/lists/:code` — fetch a list and its shopping-list items
- `POST /api/lists/:code/items` — add an item
- `PATCH /api/lists/:code/items/:id` — update an item (e.g. toggle checked)
- `DELETE /api/lists/:code/items/:id` — remove an item
- `POST /api/lists/:code/clear-checked` — remove all checked items

**Inventory** — item, quantity, and expiry date are required; weight, purchase date, and price are optional. Each item also tracks a `used` flag (defaults to `false`) so the tab can show what's still in the pantry vs. what's been used up.
- `POST /api/lists/:code/inventory` — add an inventory item (`name`, `quantity`, `weightValue?`, `weightUnit?`, `expiryDate`, `purchaseDate?`, `price?`)
- `PATCH /api/lists/:code/inventory/:id` — update any subset of those fields, or `used`
- `DELETE /api/lists/:code/inventory/:id` — remove an item
- `POST /api/lists/:code/inventory/clear-used` — remove all items marked used

A Socket.IO connection joins a room per list code; the server broadcasts the full `items` list and the full `inventory` list on every change to either, so everyone viewing that list updates live.

### Running the server locally

Requires a Postgres database.

```bash
cd server
npm install
cp .env.example .env   # edit DATABASE_URL to point at your Postgres instance
npm start
```

The server creates its tables automatically on startup (see `server/schema.sql`).

### Deploying to Railway

1. Create a new Railway project, add a **Postgres** plugin to it.
2. Add a service from this repo, with **root directory set to `server/`**.
3. Set the service's `DATABASE_URL` env var to the Postgres plugin's connection string (Railway can reference it directly, e.g. `${{Postgres.DATABASE_URL}}`).
4. Deploy — Railway detects `server/package.json` and runs `npm start`. It injects `PORT` automatically.
5. Copy the service's public URL and set it as `API_BASE_URL` in `src/app/core/app-config.ts`, then rebuild the app (`npm run build`) so it points at your deployed API instead of `localhost`.
