import React, { useState, useEffect } from "react";
import Board from "./components/Board";
import NumberPad from "./components/NumberPad";
import { generatePuzzle, gridToString, stringToGrid } from "./utils/generatePuzzle";
import Confetti from "react-confetti";
import { useAuth } from "./AuthProvider";
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from "firebase/firestore";
import { firestore } from "./firebase";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion as Motion } from "motion/react";

async function createPuzzle(diff) {
  const next = generatePuzzle(diff);
  const puzzle = next.puzzle.map((row) =>
    row.map((cell) => ({
      value: cell,
      notes: [],
      fixed: cell !== "",
    }))
  );
  const docRef = await addDoc(collection(firestore, "puzzles"), {
    puzzle: gridToString(next.puzzle),
    solution: gridToString(next.solution),
    difficulty: diff,
    createdAt: serverTimestamp(),
  });
  return { puzzle, solution: next.solution, seed: docRef.id };
}

function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// Firestore does not support nested arrays nicely, so store the board as a
// single array of 81 cells and convert back when loading.
function boardToArray(board) {
  return board.flat().map((cell) => ({
    value: cell.value,
    notes: cell.notes,
    fixed: cell.fixed,
  }));
}

function arrayToBoard(arr) {
  return Array.from({ length: 9 }, (_, i) =>
    arr.slice(i * 9, (i + 1) * 9)
  );
}

export default function Game() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [seedInputMode, setSeedInputMode] = useState(false);
  const [seedText, setSeedText] = useState("");
  const [seed, setSeed] = useState("");
  const [gameId, setGameId] = useState(null);

  useEffect(() => {
    const seedParam = searchParams.get("seed");
    const gameParam = searchParams.get("game");
    if (seedParam) {
      loadSeed(seedParam, gameParam);
      setSearchParams({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSeed(seedValue, gameValue) {
    const puzzleSnap = await getDoc(doc(firestore, "puzzles", seedValue));
    if (!puzzleSnap.exists()) return;
    const data = puzzleSnap.data();
    const puzzle = stringToGrid(data.puzzle).map((row) =>
      row.map((cell) => ({ value: cell, notes: [], fixed: cell !== "" }))
    );
    const solution = stringToGrid(data.solution);
    setDifficulty(data.difficulty);
    setPuzzleData({ puzzle, solution, seed: seedValue });
    setSeed(seedValue);
    let boardData = puzzle.map((row) => row.map((c) => ({ ...c })));
    let secs = 0;
    if (gameValue) {
      const gameSnap = await getDoc(doc(firestore, "users", user.uid, "games", gameValue));
      if (gameSnap.exists()) {
        const g = gameSnap.data();
        boardData = arrayToBoard(g.board);
        secs = g.secondsElapsed || 0;
        setGameId(gameValue);
      }
    } else if (user) {
      const gameRef = await addDoc(collection(firestore, "users", user.uid, "games"), {
        puzzleSeed: seedValue,
        difficulty: data.difficulty,
        board: boardToArray(boardData),
        secondsElapsed: 0,
        completed: false,
        createdAt: serverTimestamp(),
      });
      setGameId(gameRef.id);
    }
    setBoard(boardData);
    setSecondsElapsed(secs);
    setSelected([null, null]);
    setCompleted(false);
    setCorrect(false);
    setTimerActive(true);
    setRecorded(false);
    setStage("play");
  }

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

  async function startPuzzle() {
    let next;
    if (seedInputMode && seedText) {
      await loadSeed(seedText);
      return;
    } else {
      next = await createPuzzle(difficulty);
    }
    setPuzzleData(next);
    setSeed(next.seed);
    setBoard(next.puzzle.map((row) => row.map((cell) => ({ ...cell }))));
    setSelected([null, null]);
    setCompleted(false);
    setCorrect(false);
    setSecondsElapsed(0);
    setTimerActive(true);
    setRecorded(false);
    setSeedInputMode(false);
    setSeedText("");
    if (user) {
      const gameRef = await addDoc(collection(firestore, "users", user.uid, "games"), {
        puzzleSeed: next.seed,
        difficulty,
        board: boardToArray(next.puzzle.map((row) => row.map((c) => ({ ...c })))),
        secondsElapsed: 0,
        completed: false,
        createdAt: serverTimestamp(),
      });
      setGameId(gameRef.id);
    }
    setStage("play");
  }

  function resetToSelect() {
    setStage("select");
    setBoard(null);
    setPuzzleData(null);
    setSeed("");
    setGameId(null);
  }

  useEffect(() => {
    const complete =
      board && board.every((row) => row.every((cell) => cell.value));
    if (complete) {
      const correct =
        puzzleData &&
        board.every((row, i) =>
          row.every((cell, j) => cell.value === (puzzleData.solution[i][j] || ""))
        );
      setCompleted(true);
      setCorrect(!!correct);
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
    if (user && gameId && board) {
      updateDoc(doc(firestore, "users", user.uid, "games", gameId), {
        board: boardToArray(board),
        secondsElapsed,
      });
    }
  }, [board, secondsElapsed, user, gameId]);

  useEffect(() => {
    if (completed && correct) {
      setTimerActive(false);
      if (user && gameId && !recorded) {
        updateDoc(doc(firestore, "users", user.uid, "games", gameId), {
          completed: true,
          time: secondsElapsed,
          completedAt: serverTimestamp(),
        });
        setRecorded(true);
      }
    }
  }, [completed, correct, user, secondsElapsed, recorded, gameId]);

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
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => setSeedInputMode((s) => !s)}
              className="mb-2 px-4 py-2 bg-purple-200 rounded"
            >
              {seedInputMode ? "Cancel Seed" : "Seed"}
            </Motion.button>
            <AnimatePresence>
              {seedInputMode && (
                <Motion.input
                  key="seedinput"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  value={seedText}
                  onChange={(e) => setSeedText(e.target.value)}
                  placeholder="Enter seed"
                  className="px-2 py-1 border rounded mb-2"
                />
              )}
            </AnimatePresence>
            <Motion.button
              whileTap={{ scale: 0.95 }}
              onClick={startPuzzle}
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
              onClick={resetToSelect}
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
            {seed && (
              <div className="mt-4 flex items-center gap-2 text-sm">
                <span className="font-mono">Seed: {seed}</span>
                <button
                  className="p-1 bg-gray-200 rounded"
                  onClick={() => navigator.clipboard.writeText(seed)}
                >
                  📋
                </button>
              </div>
            )}
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

