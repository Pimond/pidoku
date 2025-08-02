import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthProvider';
import { motion as Motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user } = useAuth();
  const [games, setGames] = useState([]);

  useEffect(() => {
    async function fetchGames() {
      if (!user) return;
      const res = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGames(data.games);
      }
    }
    fetchGames();
  }, [user]);

  const completedCount = useMemo(
    () => games.filter((g) => g.completedAt).length,
    [games]
  );
  const totalGames = games.length;
  const completionRate = totalGames
    ? Math.round((completedCount / totalGames) * 100)
    : 0;

  if (!user) {
    return (
      <div className="p-4">
        <p className="mb-2">You must be logged in to view this page.</p>
        <Link className="underline" to="/">Back to Game</Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto">
      <div className="flex flex-col items-center mb-8">
        <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center text-3xl font-bold">
          {user.uid.slice(0, 2).toUpperCase()}
        </div>
        <p className="mt-3 text-xl font-semibold break-all">{user.uid}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-8">
        <div className="border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold">{totalGames}</p>
          <p className="text-sm text-gray-500">Total Games</p>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold">{completedCount}</p>
          <p className="text-sm text-gray-500">Completed</p>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold">{completionRate}%</p>
          <p className="text-sm text-gray-500">Completion Rate</p>
        </div>
      </div>

      {games.length === 0 ? (
        <p className="text-center">No game records yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Difficulty</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Time</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {games.map((game) => (
                <Motion.tr
                  key={game.id}
                  initial={{ opacity: 0, translateY: -5 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t last:border-b"
                >
                  <td className="px-4 py-2">
                    {game.completedAt?.toDate
                      ? game.completedAt
                          .toDate()
                          .toLocaleDateString()
                      : game.createdAt?.toDate
                      ? game.createdAt.toDate().toLocaleDateString()
                      : '-'}
                  </td>
                  <td className="px-4 py-2 capitalize">
                    {game.difficulty}
                  </td>
                  <td className="px-4 py-2">
                    {game.completedAt ? 'Completed' : 'In Progress'}
                  </td>
                  <td className="px-4 py-2">
                    {game.time
                      ? `${Math.floor(game.time / 60)}m ${game.time % 60}s`
                      : '-'}
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      className="text-blue-600 underline text-sm"
                      to={`/?seed=${game.puzzleSeed}&game=${game.id}`}
                    >
                      {game.completedAt ? 'View' : 'Resume'}
                    </Link>
                  </td>
                </Motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Link className="block mt-6 underline text-center" to="/">
        Back to Game
      </Link>
    </div>
  );
}
