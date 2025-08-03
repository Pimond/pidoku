import { useState } from "react";
import { motion as Motion, AnimatePresence } from "motion/react";

export default function LobbyView({ joinCode, difficulty, seed, players, onStart }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(joinCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy join code', err);
    }
  }

  return (
    <div className="flex flex-col items-center w-full">
      <h2 className="text-2xl font-bold mb-4">Lobby</h2>
      <div className="flex items-center gap-2 mb-4 relative">
        <span className="font-mono text-lg">Code: {joinCode}</span>
        <Motion.button
          whileTap={{ scale: 0.9 }}
          className="p-1 bg-gray-200 rounded"
          onClick={handleCopy}
        >
          📋
        </Motion.button>
        <AnimatePresence>
          {copied && (
            <Motion.span
              key="copied"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded"
            >
              Copied!
            </Motion.span>
          )}
        </AnimatePresence>
      </div>
      <div className="mb-4 text-center">
        <p>Difficulty: {difficulty}</p>
        {seed && <p>Seed: {seed}</p>}
      </div>
      <div className="mb-6 w-full">
        <h3 className="font-bold mb-2">Players</h3>
        <ul className="list-disc list-inside">
          {players.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
      {onStart && (
        <Motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onStart}
          className="px-6 py-2 bg-green-400 rounded text-white font-bold"
        >
          Start Game
        </Motion.button>
      )}
    </div>
  );
}

