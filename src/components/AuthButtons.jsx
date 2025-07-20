import React, { useState } from 'react';
import { useAuth } from '../AuthProvider';
import { AnimatePresence, motion as Motion } from 'motion/react';

export default function AuthButtons() {
  const { user } = useAuth();
  const [formType, setFormType] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setShowRegisterPrompt(false);
    try {
      let endpoint = '/api/login';
      if (formType === 'register') {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        endpoint = '/api/register';
      }
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Authentication failed');
        return;
      }
      localStorage.setItem('token', data.idToken);
      window.location.reload();
    } catch (err) {
      setError(err.message);
    }
  }

  if (user) {
    return (
      <button
        className="ml-4 px-3 py-1 text-sm bg-gray-200 rounded"
        onClick={() => {
          localStorage.removeItem('token');
          window.location.reload();
        }}
      >
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
            <AnimatePresence initial={false}>
              {formType === 'register' && (
                <Motion.input
                  key="confirm"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-2 py-1 border rounded text-sm"
                  type="password"
                  placeholder="repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              )}
            </AnimatePresence>
            <button className="px-3 py-1 bg-blue-200 rounded text-sm" type="submit">
              {formType === 'login' ? 'Log In' : 'Register'}
            </button>
            <button
              type="button"
              className="text-xs underline"
              onClick={() => {
                setFormType(formType === 'login' ? 'register' : 'login');
                setError('');
                setShowRegisterPrompt(false);
              }}
            >
              {formType === 'login' ? 'Need an account?' : 'Have an account?'}
            </button>
            <AnimatePresence>
              {error && (
                <Motion.div
                  key="err"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-xs text-red-600"
                >
                  {error}{' '}
                  {showRegisterPrompt && (
                    <button
                      type="button"
                      className="underline ml-1"
                      onClick={() => {
                        setFormType('register');
                        setError('');
                        setShowRegisterPrompt(false);
                      }}
                    >
                      Register now?
                    </button>
                  )}
                </Motion.div>
              )}
            </AnimatePresence>
          </Motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
