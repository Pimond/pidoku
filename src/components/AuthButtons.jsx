import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../AuthProvider';

export default function AuthButtons() {
  const { user } = useAuth();
  const [formType, setFormType] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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
    <div className="ml-4">
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
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
      </form>
      <button
        type="button"
        className="mt-1 text-xs underline"
        onClick={() => setFormType(formType === 'login' ? 'register' : 'login')}
      >
        {formType === 'login' ? 'Need an account?' : 'Have an account?'}
      </button>
      {error && <div className="text-xs text-red-600">{error}</div>}
    </div>
  );
}
