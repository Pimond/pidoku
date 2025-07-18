import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../AuthProvider';
import { AnimatePresence, motion as Motion } from 'motion/react';

export default function AuthButtons() {
  const { user } = useAuth();
  const [formType, setFormType] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (formType === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      setEmail('');
      setPassword('');
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    }
  }

  if (user) {
    return (
      <button className="ml-4 px-3 py-1 text-sm bg-gray-200 rounded" onClick={() => signOut(auth)}>
        Sign Out
      </button>
    );
  }

  return (
    <div className="ml-4 relative">
      <button
        className="px-3 py-1 bg-gray-200 rounded text-sm"
        onClick={() => setShowForm((s) => !s)}
      >
        {showForm ? 'Close' : 'Login'}
      </button>
      <AnimatePresence>
        {showForm && (
          <Motion.form
            key="auth"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 p-3 bg-white rounded shadow flex flex-col gap-2 z-10"
          >
            <input
              className="px-2 py-1 border rounded text-sm"
              type="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="px-2 py-1 border rounded text-sm"
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button className="px-3 py-1 bg-blue-200 rounded text-sm" type="submit">
              {formType === 'login' ? 'Log In' : 'Register'}
            </button>
            <button
              type="button"
              className="text-xs underline"
              onClick={() => setFormType(formType === 'login' ? 'register' : 'login')}
            >
              {formType === 'login' ? 'Need an account?' : 'Have an account?'}
            </button>
            {error && <div className="text-xs text-red-600">{error}</div>}
          </Motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
