// server.js
/* eslint-env node */
/* global process */
import express from 'express';
import admin from 'firebase-admin';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    ),
  });
}

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

// Helper to sign in via Firebase REST API
async function signInWithPassword(email, password) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  return res.json();
}

// ── Public routes (no token required) ── //

// POST /api/login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const data = await signInWithPassword(email, password);
    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }
    res.json({ idToken: data.idToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/register
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    await admin.auth().createUser({ email, password });
    const data = await signInWithPassword(email, password);
    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }
    res.json({ idToken: data.idToken });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/puzzles/:id  (public read)
app.get('/api/puzzles/:id', async (req, res) => {
  try {
    const snap = await admin
      .firestore()
      .collection('puzzles')
      .doc(req.params.id)
      .get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(snap.data());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/puzzles  (public create)
app.post('/api/puzzles', async (req, res) => {
  try {
    const { puzzle, solution, difficulty } = req.body;
    const docRef = await admin
      .firestore()
      .collection('puzzles')
      .add({
        puzzle,
        solution,
        difficulty,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    res.json({ id: docRef.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Protected routes (require valid Firebase ID token) ── //

// Authentication middleware
app.use(async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;
  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// GET /api/profile
app.get('/api/profile', async (req, res) => {
  try {
    const gamesSnap = await admin
      .firestore()
      .collection('users')
      .doc(req.user.uid)
      .collection('games')
      .orderBy('createdAt', 'desc')
      .get();
    const games = gamesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ games });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/games/:id
app.get('/api/games/:id', async (req, res) => {
  try {
    const snap = await admin
      .firestore()
      .collection('users')
      .doc(req.user.uid)
      .collection('games')
      .doc(req.params.id)
      .get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(snap.data());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/games
app.post('/api/games', async (req, res) => {
  try {
    const ref = await admin
      .firestore()
      .collection('users')
      .doc(req.user.uid)
      .collection('games')
      .add({
        puzzleSeed: req.body.puzzleSeed,
        difficulty: req.body.difficulty,
        board: req.body.board,
        secondsElapsed: 0,
        completed: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    res.json({ id: ref.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/games/:id
app.patch('/api/games/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.completed === true) {
      data.completedAt = admin.firestore.FieldValue.serverTimestamp();
      delete data.completed;
    }
    await admin
      .firestore()
      .collection('users')
      .doc(req.user.uid)
      .collection('games')
      .doc(req.params.id)
      .update(data);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/me
app.get('/api/me', (req, res) => {
  res.json({ uid: req.user.uid });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
