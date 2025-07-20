// server/app.js
import express from 'express';
import admin from 'firebase-admin';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// Initialize Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    ),
  });
}

// -- your routes exactly as before --

// Public
app.post('/api/login', /*…*/);
app.post('/api/register', /*…*/);
app.get ('/api/puzzles/:id', /*…*/);
app.post('/api/puzzles', /*…*/);

// Auth guard
app.use(/*…*/);

// Protected
app.get ('/api/profile', /*…*/);
app.get ('/api/games/:id', /*…*/);
app.post('/api/games', /*…*/);
app.patch('/api/games/:id', /*…*/);
app.get ('/api/me', /*…*/);

export default app;
