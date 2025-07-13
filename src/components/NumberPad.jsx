import { motion } from "motion/react"
export default function NumberPad({ onInput, onErase, noteMode, onToggleNoteMode, highlightedNotes = [] }) {
  return (
    <div className="flex flex-col items-center mt-6">
      <div className="grid grid-cols-3 gap-2 mb-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => {
          const isHighlighted = noteMode && highlightedNotes.includes(n.toString());
          return (
            <motion.button
              whileTap={{ scale: 0.8, transition: { duration: 0.01 } }}
              key={n}
              onClick={() => onInput(String(n))}
              className={
                "w-12 h-12 rounded text-2xl font-bold shadow transition " +
                (isHighlighted
                  ? "bg-yellow-100 border-1 border-yellow-400"
                  : "bg-gray-300 hover:bg-gray-400")
              }
            >
              {n}
            </motion.button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <motion.button
          whileTap={{ scale: 0.8, transition: { duration: 0.01 } }}

          onClick={onToggleNoteMode}
          className={`w-20 h-10 rounded text-lg font-bold shadow ${noteMode
            ? "bg-yellow-400 hover:bg-yellow-500"
            : "bg-gray-200 hover:bg-gray-300"
            }`}
        >
          Note
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.8, transition: { duration: 0.01 } }}

          onClick={onErase}
          className="w-20 h-10 bg-red-200 rounded text-lg font-bold shadow hover:bg-red-300 transition"
        >
          Erase
        </motion.button>
      </div>
    </div>
  );
}
