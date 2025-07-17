import React, { useState, useEffect } from "react";
import Board from "./components/Board";
import NumberPad from "./components/NumberPad";
import { generatePuzzle } from "./utils/generatePuzzle";
import Confetti from "react-confetti";
import { useAuth } from "./AuthProvider";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "./firebase";
import { AnimatePresence, motion as Motion } from "motion/react";

function createPuzzle(diff) {
  const next = generatePuzzle(diff);
  const puzzle = next.puzzle.map((row) =>
    row.map((cell) => ({
      value: cell,
      notes: [],
      fixed: cell !== "",
    }))
  );
  return { puzzle, solution: next.solution };
}

function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export default function Game() {
  const { user } = useAuth();
  const [difficulty, setDifficulty] = useState("easy");
  const [stage, setStage] = useState("select");
  const [puzzleData, setPuzzleData] = useState(null);
  const [board, setBoard] = useState(null);
  const [selected, setSelected] = useState([null, null]);
  const [noteMode, setNoteMode] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(true);
  const [recorded, setRecorded] = useState(false);

  function handleCellSelect(row, col) {
    setSelected([row, col]);
  }

  function handleNumberInput(val) {
    const [row, col] = selected;
    if (row === null || col === null) return;
    setBoard((prev) => {
      let newBoard = prev.map((r, i) =>
        r.map((cell, j) => {
          if (i !== row || j !== col || cell.fixed) return cell;
          if (noteMode) {
            const notes = cell.notes.includes(val)
              ? cell.notes.filter((n) => n !== val)
              : [...cell.notes, val].sort();
            return { ...cell, notes };
          }
          return { ...cell, value: val, notes: [] };
        })
      );
      if (!noteMode) {
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        newBoard = newBoard.map((r, i) =>
          r.map((cell, j) => {
            if ((i === row && j === col) || cell.fixed) return cell;
            const sameRow = i === row;
            const sameCol = j === col;
            const sameBox =
              i >= boxRow && i < boxRow + 3 && j >= boxCol && j < boxCol + 3;
            if ((sameRow || sameCol || sameBox) && cell.notes.includes(val)) {
              return { ...cell, notes: cell.notes.filter((n) => n !== val) };
            }
            return cell;
          })
        );
      }
      return newBoard;
    });
  }

  function handleErase() {
    const [row, col] = selected;
    if (row === null || col === null) return;
    setBoard((prev) =>
      prev.map((r, i) =>
        r.map((cell, j) =>
          i === row && j === col && !cell.fixed ? { ...cell, value: "", notes: [] } : cell
        )
      )
    );
  }

  function handleNewPuzzle() {
    const next = createPuzzle(difficulty);
    setPuzzleData(next);
    setBoard(next.puzzle.map((row) => row.map((cell) => ({ ...cell }))));
    setSelected([null, null]);
    setCompleted(false);
    setCorrect(false);
    setSecondsElapsed(0);
    setTimerActive(true);
    setRecorded(false);
    setStage("play");
  }

  function checkCompletion() {
    if (!board) return false;
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (!board[i][j].value) return false;
      }
    }
    return true;
  }

  function checkCorrect() {
    if (!board || !puzzleData) return false;
    const { solution } = puzzleData;
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (board[i][j].value !== (solution[i][j] || "")) return false;
      }
    }
    return true;
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (checkCompletion()) {
      setCompleted(true);
      setCorrect(checkCorrect());
    } else {
      setCompleted(false);
      setCorrect(false);
    }
  }, [board, puzzleData]);

  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => {
      setSecondsElapsed((secs) => secs + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  useEffect(() => {
    if (completed && correct) {
      setTimerActive(false);
      if (user && !recorded) {
        addDoc(collection(firestore, "users", user.uid, "games"), {
          difficulty,
          time: secondsElapsed,
          completedAt: serverTimestamp(),
        });
        setRecorded(true);
      }
    }
  }, [completed, correct, user, secondsElapsed, recorded]);

  const selectedCellNotes =
    board && selected[0] !== null && selected[1] !== null
      ? board[selected[0]][selected[1]].notes
      : [];

  return (
    <div className="p-4 flex flex-col items-center">
      <AnimatePresence mode="wait">
        {stage === "select" ? (
          <Motion.div
            key="select"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center mt-10"
          >
            <h2 className="text-2xl font-bold mb-4">Choose Difficulty</h2>
            <div className="flex gap-4 mb-4">
              {["easy", "medium", "hard"].map((diff) => (
                <Motion.button
                  key={diff}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setDifficulty(diff)}
                  className={`px-4 py-2 rounded shadow ${
                    difficulty === diff
                      ? "bg-blue-400 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </Motion.button>
              ))}
            </div>
            <Motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleNewPuzzle}
              className="px-6 py-2 bg-green-400 rounded text-white font-bold"
            >
              Start
            </Motion.button>
          </Motion.div>
        ) : (
          <Motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center w-full"
          >
            <button
              onClick={handleNewPuzzle}
              className="mb-4 px-4 py-2 bg-blue-200 hover:bg-blue-300 rounded font-bold"
            >
              New Puzzle
            </button>
            {completed && correct && (
              <>
                <Confetti
                  width={window.innerWidth}
                  height={window.innerHeight}
                  numberOfPieces={400}
                />
                <div className="mb-4 px-6 py-3 bg-green-200 text-green-800 rounded shadow text-xl font-bold">
                  🎉 You solved it!
                </div>
              </>
            )}
            {completed && !correct && (
              <div className="mb-4 px-6 py-3 bg-red-200 text-red-800 rounded shadow text-xl font-bold">
                Puzzle is filled, but something's wrong!
              </div>
            )}
            <div className="mb-4 text-xl font-mono text-gray-700">Time: {formatTime(secondsElapsed)}</div>
            {board && (
              <Board
                board={board}
                selected={selected}
                onCellSelect={handleCellSelect}
              />
            )}
            {board && (
              <NumberPad
                onInput={handleNumberInput}
                onErase={handleErase}
                noteMode={noteMode}
                onToggleNoteMode={() => setNoteMode((x) => !x)}
                highlightedNotes={noteMode ? selectedCellNotes : []}
              />
            )}
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

