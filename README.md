# app-barcode

An opinioned utility app for generating and managing barcodes and QR codes for use when developing apps that consume them.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

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

## Progressive Web App (PWA)

This app is configured as an installable Progressive Web App using `vite-plugin-pwa`.

### Regenerating PWA Assets
If you update `public/code-icon.svg`, regenerate all PWA icons (PNG icons, apple-touch-icon, favicon):
```sh
npm run generate-pwa-assets
```

### Testing the PWA Locally
PWA installation and Service Worker caching require a production build:
1. Build and start the preview server:
   ```sh
   npm run build
   npm run preview
   ```
2. Open the URL provided by the preview command (typically `http://localhost:4173`).

### Installing the PWA
- **Chrome / Edge (Desktop)**: Click the **Install Barcode Generator** icon in the right side of the address bar, or select **Menu (⋮) > Save and share > Install Barcode Generator...**.
- **Chrome (Android)**: Tap the **⋮** menu button and select **Add to Home screen** / **Install app**.
- **Safari (iOS)**: Tap the **Share** icon and select **Add to Home Screen**.

### Verifying PWA in DevTools
1. Open Chrome DevTools (`F12` / `Cmd+Option+I`).
2. Navigate to the **Application** tab:
   - **Manifest**: Verify application name, short name, theme color, display mode (`standalone`), and icons.
   - **Service Workers**: Verify `sw.js` is registered and active. Test offline capabilities by checking the **Offline** checkbox and refreshing the page.

