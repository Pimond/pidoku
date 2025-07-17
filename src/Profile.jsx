import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { firestore } from './firebase';
import { motion as Motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user } = useAuth();
  const [games, setGames] = useState([]);

  useEffect(() => {
    async function fetchGames() {
      if (!user) return;
      const q = query(
        collection(firestore, 'users', user.uid, 'games'),
        orderBy('completedAt', 'desc')
      );
      const snap = await getDocs(q);
      setGames(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    fetchGames();
  }, [user]);

  if (!user) {
    return (
      <div className="p-4">
        <p className="mb-2">You must be logged in to view this page.</p>
        <Link className="underline" to="/">Back to Game</Link>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Profile</h2>
      {games.length === 0 ? (
        <p>No game records yet.</p>
      ) : (
        <ul className="space-y-2">
          {games.map(game => (
            <Motion.li
              key={game.id}
              initial={{ opacity: 0, translateY: -5 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ duration: 0.2 }}
              className="p-2 bg-gray-100 rounded shadow"
            >
              <div className="text-sm">
                <span className="font-semibold mr-2">{game.difficulty}</span>
                {game.time}s
              </div>
              {game.completedAt?.toDate && (
                <div className="text-xs text-gray-500">
                  {game.completedAt.toDate().toLocaleString()}
                </div>
              )}
            </Motion.li>
          ))}
        </ul>
      )}
      <Link className="block mt-6 underline" to="/">Back to Game</Link>
    </div>
  );
}
