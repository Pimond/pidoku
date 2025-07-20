# Pidoku

An in-progress web-based sudoku game. Currently single-player, but will have user accounts, multi-player, etc. soon!

## Backend server

The project now includes a small Express server under `server/` which uses the
Firebase Admin SDK. Iranian players cannot access Firebase directly, so all
authentication and game data requests go through this server instead.

1. Create a `.env` file (or set environment variables) containing:
   - `FIREBASE_SERVICE_ACCOUNT` – the JSON for your Firebase service account
   - `FIREBASE_API_KEY` – your Firebase API key
   - `PORT` (optional) – port for the server to listen on
2. Start the server with `npm run server`.

The frontend expects the server to run on the same origin (e.g., both served by
your VPS).

