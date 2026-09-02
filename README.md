# Grocery Agent

A mobile grocery list app built with [Ionic](https://ionicframework.com/), Angular, and [Capacitor](https://capacitorjs.com/) — runs as a web app and packages to native iOS/Android.

## Stack

- Angular 20 (standalone components)
- Ionic Angular 9 (standalone components, `@ionic/angular`)
- Capacitor 8 for native shell + `@capacitor/preferences` for local storage

## Development server

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
