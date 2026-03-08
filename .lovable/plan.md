

# Fix PWA Manifest: Add 512x512 Icons + Service Worker

## Problem
PWA Builder reports the manifest is missing:
1. A **512x512 PNG icon** (only has small favicon.ico)
2. The `start_url` field (it's actually present in manifest.json, so PWA Builder may have read an older version)

The user also uploaded a **service worker file** (`pwabuilder-sw.js`) to enable offline support.

## Plan

### 1. Generate PWA Icons
Since no 512x512 image was provided, I'll create a simple SVG-based icon set programmatically and reference them in the manifest. The icons will use the MFC brand colors (crimson `#8B1A1A` background, gold `#D4A853` text "MFC").

Create SVG icons at these sizes and add to `public/`:
- `public/icon-192.png` — use an inline SVG-to-canvas approach isn't possible in static files, so instead create a **single SVG icon** (`public/icon.svg`) that scales to any size, and reference it as `any` size in the manifest with `purpose: "any maskable"`.

Actually, the simplest approach: create a high-quality SVG icon and list it in the manifest. PWA Builder accepts SVG icons with `"sizes": "any"`.

### 2. Update `public/manifest.json`
- Ensure `start_url: "/"` is present (it already is, but re-confirm)
- Add the SVG icon entry with `"sizes": "any"` and `"purpose": "any maskable"`
- Add `"id": "/"` for PWA identity

### 3. Add Service Worker
- Copy `user-uploads://pwabuilder-sw.js` to `public/pwabuilder-sw.js`
- Update the offline fallback page reference to `"/"`  
- Register the service worker in `index.html` with a `<script>` tag

### 4. Create Offline Fallback Page
- Create a minimal `public/offline.html` page with MFC branding that shows when offline

## Files to Create
1. `public/icon.svg` — 512x512-compatible SVG icon with MFC branding
2. `public/offline.html` — offline fallback page
3. `public/pwabuilder-sw.js` — copied from user upload, with offline page reference fixed

## Files to Edit
1. `public/manifest.json` — add SVG icon, ensure start_url and id
2. `index.html` — add service worker registration script

**Note:** For a fully compliant PWA with raster icons (PNG 192x192 and 512x512), you would need to provide or generate actual PNG images. The SVG approach satisfies most modern browsers. If you have a logo image file, share it and I can generate proper PNG icons from it.

