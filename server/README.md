# Backend Server

This Express server uses the Firebase Admin SDK to handle authentication and database
requests. Iranian clients connect to this server instead of directly to Firebase
so they can bypass blocked domains.

Environment variables required:

- `FIREBASE_SERVICE_ACCOUNT`: JSON credentials for the service account.
- `FIREBASE_API_KEY`: API key for the Firebase project.
- `PORT` (optional): port to listen on (defaults to 3001).

Run the server with:

```bash
node server/index.js
```
