import React from "react";

export default function NumberPad({ onInput, onErase, noteMode, onToggleNoteMode }) {
  return (
    <div className="flex flex-col items-center mt-6">
      <div className="grid grid-cols-3 gap-2 mb-2">
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button
            key={n}
            onClick={() => onInput(String(n))}
            className="w-12 h-12 bg-gray-300 rounded text-2xl font-bold shadow hover:bg-gray-400 transition"
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={onToggleNoteMode}
          className={`w-20 h-10 rounded text-lg font-bold shadow ${
            noteMode
              ? "bg-yellow-400 hover:bg-yellow-500"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          {noteMode ? "Note" : "Note"}
        </button>
        <button
          onClick={onErase}
          className="w-20 h-10 bg-red-200 rounded text-lg font-bold shadow hover:bg-red-300 transition"
        >
          Erase
        </button>
      </div>
    </div>
  );
}
