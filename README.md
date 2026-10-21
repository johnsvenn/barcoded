# Barcoded

An opinioned utility app for generating and displaying barcodes and QR codes for use when developing apps that consume them. 

Barcoded is intended to be run locally as a Progressive Web Application (PWA).

All data is stored locally in the browser's built in IndexedDB datastore.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

## Progressive Web Application (PWA)

This app is configured as an installable Progressive Web Application using `vite-plugin-pwa`.

### Regenerating PWA Assets
If you update `public/code-icon.svg`, regenerate all PWA icons (PNG icons, apple-touch-icon, favicon):
```sh
npm run generate-pwa-assets
```

### Building the PWA
PWA installation and Service Worker caching only work with a production build, not `npm run dev`.

1. Install dependencies (Node `^24.12.0` is required, see `engines` in `package.json`):
   ```sh
   npm install
   ```
2. Build the app:
   ```sh
   npm run build
   ```
   This runs the TypeScript type-check, then compiles and minifies the app into the `dist/` folder. It also generates the Service Worker (`sw.js`) and the web app manifest. The build fails if the type-check fails, so fix any reported errors and run it again.

### Serving the PWA
Browsers only install a PWA from a secure origin. That means either `localhost` or a site served over HTTPS.

**Option A: Vite preview server (localhost)**

```sh
npm run preview
```

Open the URL it prints, which is `http://localhost:4174` (the port is set in `vite.config.ts`, and the server fails rather than switching ports if it is already in use).

**Option B: Any static file server**

`dist/` is a plain static site, so you can serve it with any tool. For example:

```sh
npx serve dist
```

Or, with Python:

```sh
python3 -m http.server 8080 --directory dist
```

Then open `http://localhost:8080` (or the port your server reports).

To install the app on another device on your network, you need HTTPS. Plain `http://` with an IP address will not offer installation. Deploy the contents of `dist/` to any HTTPS host (for example Netlify, Vercel, or GitHub Pages) to test on a phone.

### Installing the PWA
- **Chrome / Edge (Desktop)**: Click the **Install Barcode Generator** icon in the right side of the address bar, or select **Menu (⋮) > Save and share > Install Barcode Generator...**.
- **Chrome (Android)**: Tap the **⋮** menu button and select **Add to Home screen** / **Install app**.
- **Safari (iOS)**: Tap the **Share** icon and select **Add to Home Screen**.

### Verifying PWA in DevTools
1. Open Chrome DevTools (`F12` / `Cmd+Option+I`).
2. Navigate to the **Application** tab:
   - **Manifest**: Verify application name, short name, theme color, display mode (`standalone`), and icons.
   - **Service Workers**: Verify `sw.js` is registered and active. Test offline capabilities by checking the **Offline** checkbox and refreshing the page.

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

