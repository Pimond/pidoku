import React from "react";
import { motion as Motion } from "motion/react";

export default function LobbyView({
  lobby,
  currentUid,
  ready = false,
  progress = 0,
  showControls = true,
  onReady = () => {},
  onStart = () => {},
  onLeave = () => {},
  countdown = null,
}) {
  if (!lobby) return null;
  const isHost = lobby.hostUid === currentUid;

  function handleCopy() {
    navigator.clipboard.writeText(lobby.joinCode);
  }

  return (
    <div className="w-full bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="font-mono text-lg">Code: {lobby.joinCode}</div>
        <Motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleCopy}
          className="p-1 bg-gray-200 rounded"
        >
          📋
        </Motion.button>
      </div>
      <div className="mb-4 text-sm">
        <div>Difficulty: {lobby.difficulty}</div>
      </div>
      <ul className="mb-4 space-y-1">
        {lobby.players.map((uid) => (
          <li key={uid} className="flex items-center gap-2">
            <span className="flex-1">{uid === currentUid ? "You" : uid}</span>
            {uid === lobby.hostUid && <span>👑</span>}
            {showControls ? (
              uid === currentUid && ready ? (
                <span className="text-green-600">✔️</span>
              ) : null
            ) : (
              <span>{uid === currentUid ? Math.round(progress) : 0}%</span>
            )}
          </li>
        ))}
      </ul>
      {showControls && (
        <div className="flex gap-2 justify-center">
          <Motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onReady}
            className="px-4 py-2 bg-green-200 rounded"
          >
            {ready ? "Unready" : "Ready"}
          </Motion.button>
          <Motion.button
            whileTap={{ scale: isHost && !countdown ? 0.95 : 1 }}
            onClick={isHost && !countdown ? onStart : undefined}
            disabled={!isHost}
            title={isHost ? "" : "Only the host has that power!"}
            className={`px-4 py-2 rounded ${
              isHost ? "bg-blue-400 text-white" : "bg-gray-300 text-gray-600 cursor-not-allowed"
            }`}
          >
            {countdown !== null ? (countdown === 0 ? "Go!" : countdown) : "Start"}
          </Motion.button>
          <Motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onLeave}
            className="px-4 py-2 bg-red-200 rounded"
          >
            Leave
          </Motion.button>
        </div>
      )}
    </div>
  );
}
