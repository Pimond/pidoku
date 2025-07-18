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
  const initialStage = new URLSearchParams(window.location.search).get("seed")
    ? "loading"
    : "select";
  const [stage, setStage] = useState(initialStage);
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
  const [seedCopied, setSeedCopied] = useState(false);

  useEffect(() => {
    const seedParam = searchParams.get("seed");
    const gameParam = searchParams.get("game");
    if (seedParam) {
      loadSeed(seedParam, gameParam);
      setSearchParams({});
    } else if (stage === "loading") {
      setStage("select");
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

  function handleCopySeed() {
    navigator.clipboard.writeText(seed);
    setSeedCopied(true);
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

  useEffect(() => {
    if (!seedCopied) return;
    const t = setTimeout(() => setSeedCopied(false), 1500);
    return () => clearTimeout(t);
  }, [seedCopied]);

  const selectedCellNotes =
    board && selected[0] !== null && selected[1] !== null
      ? board[selected[0]][selected[1]].notes
      : [];

  if (stage === "loading") {
    return (
      <div className="p-4 text-xl">Loading...</div>
    );
  }

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
            <div className="flex flex-wrap items-center gap-4 mb-4">
              {["easy", "medium", "hard"].map((diff) => (
                <Motion.button
                  key={diff}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  disabled={seedInputMode}
                  onClick={() => setDifficulty(diff)}
                  className={`w-24 px-4 py-2 rounded shadow transition ${difficulty === diff
                      ? "bg-blue-400 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                    } ${seedInputMode ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </Motion.button>
              ))}
              <div className="flex items-center ml-2 gap-2">
                <span className="text-sm">Seed</span>
                <Motion.div
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSeedInputMode((s) => !s)}
                  className={`w-10 h-6 rounded-full bg-gray-300 flex items-center p-1 cursor-pointer ${seedInputMode ? "bg-purple-400" : ""}`}
                >
                  <Motion.div
                    layout
                    transition={{ type: "spring", stiffness: 700, damping: 30 }}
                    className="w-4 h-4 bg-white rounded-full shadow"
                    style={{ x: seedInputMode ? 16 : 0 }}
                  />
                </Motion.div>
                <AnimatePresence>
                  {seedInputMode && (
                    <Motion.input
                      key="seedinput"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 150, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      value={seedText}
                      onChange={(e) => setSeedText(e.target.value)}
                      placeholder="Enter seed"
                      className="px-2 py-1 border rounded"
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>
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
            className="relative flex flex-col items-center w-full"
          >
            <button
              onClick={resetToSelect}
              className="mb-4 px-4 py-2 bg-blue-200 hover:bg-blue-300 rounded font-bold"
            >
              New Puzzle
            </button>
            <AnimatePresence>
              {completed && correct && (
                <Motion.div
                  key="correct"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute -top-12 px-6 py-3 bg-green-200 text-green-800 rounded shadow text-xl font-bold"
                >
                  <Confetti
                    width={window.innerWidth}
                    height={window.innerHeight}
                    numberOfPieces={400}
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      width: '100vw',
                      height: '100vh',
                      pointerEvents: 'none',
                      zIndex: 9999,
                    }}
                  />
                  🎉 You solved it!
                </Motion.div>
              )}
              {completed && !correct && (
                <Motion.div
                  key="wrong"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute -top-12 px-6 py-3 bg-red-200 text-red-800 rounded shadow text-xl font-bold"
                >
                  Puzzle is filled, but something's wrong!
                </Motion.div>
              )}
            </AnimatePresence>
            <div className="mb-4 text-2xl font-mono bg-gray-800 text-white px-4 py-1 rounded shadow">
              {formatTime(secondsElapsed)}
            </div>
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
              <div className="mt-4 flex items-center gap-2 text-sm relative">
                <span className="font-mono">Seed: {seed}</span>
                <Motion.button
                  whileTap={{ scale: 0.9 }}
                  className="p-1 bg-gray-200 rounded"
                  onClick={handleCopySeed}
                >
                  📋
                </Motion.button>
                <AnimatePresence>
                  {seedCopied && (
                    <Motion.span
                      key="copied"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.3 }}
                      className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded"
                    >
                      Seed copied!
                    </Motion.span>
                  )}
                </AnimatePresence>
              </div>
            )}
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

