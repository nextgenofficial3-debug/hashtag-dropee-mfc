# MFC - Fried Chicken Animation Studio

A premium web application for Makyo Fried Chicken (MFC) Ukhrul, featuring a modern UI, real-time ordering, and a seamless delivery experience.

## Features

- **Modern UI**: Built with React, Vite, and shadcn/ui.
- **Dynamic Animations**: Smooth transitions powered by Framer Motion.
- **Real-time Data**: Integrated with Supabase for order tracking and authentication.
- **PWA Support**: Installable on mobile and desktop devices.
- **Mobile Integration**: Capacitor support for native app deployment.

## Tech Stack

- **Core**: Vite, TypeScript, React
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase
- **State Management**: React Query
- **Routing**: React Router DOM

## Development

1. Install dependencies:
   ```sh
   npm install
   ```
2. Copy the environment template and fill in your real keys:
   ```sh
   cp .env.example .env
   ```
3. Start development server:
   ```sh
   npm run dev
   ```
4. Build for production:
   ```sh
   npm run build
   ```

## Environment

Do not commit real keys to the repository. The app expects these client-side variables:

- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_FIREBASE_VAPID_KEY`
- `VITE_GOOGLE_MAPS_API_KEY`

## Database

Apply the latest Supabase migrations before deploying. The new migration adds the missing admin whitelist, reservations table, and customer ownership policies required by the frontend.

## Deployment

The project is configured for deployment on Cloudflare Pages via the `wrangler.toml` configuration.
