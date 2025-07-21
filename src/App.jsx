import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Game from './Game.jsx';
import Profile from './Profile.jsx';
import AuthButtons from './components/AuthButtons.jsx';
import { useAuth } from './AuthProvider';

export default function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col ml-0">
      <header className="p-4 flex items-center shadow bg-white">
        <Link to="/" className="text-3xl font-bold">Pidoku</Link>
        <div className="ml-auto flex items-center">
          {user && (
            <Link
              className="mr-4 px-3 py-1 rounded bg-blue-200 hover:bg-blue-300 transition"
              to="/profile"
            >
              Profile
            </Link>
          )}
          <AuthButtons />
        </div>
      </header>
      <main className="flex-grow self-center">
        <Routes>
          <Route path="/" element={<Game />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  );
}
