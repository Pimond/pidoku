import React, { useState, useEffect } from "react";
import Board from "./components/Board";
import NumberPad from "./components/NumberPad";
import { generatePuzzle, gridToString, stringToGrid } from "./utils/generatePuzzle";
import Confetti from "react-confetti";
import { useAuth } from "./AuthProvider";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion as Motion } from "motion/react";
import BackgroundProgress from "./components/BackgroundProgress.jsx";

async function createPuzzle(diff) {
  const next = generatePuzzle(diff);
  const puzzle = next.puzzle.map((row, r) =>
    row.map((cell, c) => ({
      value: cell,
      notes: [],
      fixed: cell !== "",
      appearDelay: cell !== "" ? (r * 9 + c) * 0.03 : 0,
    }))
  );
  const res = await fetch('/api/puzzles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      puzzle: gridToString(next.puzzle),
      solution: gridToString(next.solution),
      difficulty: diff,
    }),
  });
  const data = await res.json();
  return { puzzle, solution: next.solution, seed: data.id };
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

function countDigits(board) {
  const counts = {};
  board.forEach((row) =>
    row.forEach((cell) => {
      if (cell.value) {
        counts[cell.value] = (counts[cell.value] || 0) + 1;
      }
    })
  );
  return counts;
}

function markCompleted(board) {
  const counts = countDigits(board);
  const completedIds = {};
  return board.map((row) =>
    row.map((cell) => {
      if (counts[cell.value] === 9) {
        if (!completedIds[cell.value]) {
          completedIds[cell.value] = Date.now() + Math.random();
        }
        return {
          ...cell,
          completedDigit: true,
          completionId: completedIds[cell.value],
          completionIsFinal: false,
        };
      }
      return cell;
    })
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
  const [progress, setProgress] = useState(0);

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
    const resPuzzle = await fetch(`/api/puzzles/${seedValue}`, {
      headers: { Authorization: user ? `Bearer ${user.token}` : '' },
    });
    if (!resPuzzle.ok) return;
    const data = await resPuzzle.json();
    const puzzle = stringToGrid(data.puzzle).map((row, r) =>
      row.map((cell, c) => ({
        value: cell,
        notes: [],
        fixed: cell !== "",
        appearDelay: cell !== "" ? (r * 9 + c) * 0.03 : 0,
      }))
    );
    const solution = stringToGrid(data.solution);
    setDifficulty(data.difficulty);
    setPuzzleData({ puzzle, solution, seed: seedValue });
    setSeed(seedValue);
    let boardData = puzzle.map((row) =>
      row.map((c) => ({
        ...c,
        completedDigit: false,
        completionId: null,
        completionIsFinal: false,
      }))
    );
    boardData = markCompleted(boardData);
    let secs = 0;
    if (gameValue) {
      const resGame = await fetch(`/api/games/${gameValue}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (resGame.ok) {
        const g = await resGame.json();
        boardData = markCompleted(
          arrayToBoard(g.board).map((row) =>
            row.map((c) => ({
              ...c,
              completedDigit: false,
              completionId: null,
              completionIsFinal: false,
            }))
          )
        );
        secs = g.secondsElapsed || 0;
        setGameId(gameValue);
      }
    } else if (user) {
      const resGame = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          puzzleSeed: seedValue,
          difficulty: data.difficulty,
          board: boardToArray(boardData),
        }),
      });
      const gdata = await resGame.json();
      setGameId(gdata.id);
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
      if (!noteMode) {
        const prevCounts = countDigits(prev);
        const newCounts = countDigits(newBoard);
        const completionDigit =
          newCounts[val] === 9 && prevCounts[val] !== 9 ? val : null;
        const completionId = completionDigit ? Date.now() : null;
        newBoard = newBoard.map((r, i) =>
          r.map((cell, j) => {
            const digit = cell.value;
            const count = newCounts[digit] || 0;
            const isCompleted = count === 9;
            const isFinal =
              completionDigit && digit === completionDigit && i === row && j === col;
            const id =
              completionDigit && digit === completionDigit
                ? completionId
                : isCompleted
                ? cell.completionId
                : null;
            return {
              ...cell,
              completedDigit: isCompleted,
              completionId: id,
              completionIsFinal: isFinal,
            };
          })
        );
      }
      return newBoard;
    });
  }

  function handleErase() {
    const [row, col] = selected;
    if (row === null || col === null) return;
    setBoard((prev) => {
      let newBoard = prev.map((r, i) =>
        r.map((cell, j) =>
          i === row && j === col && !cell.fixed ? { ...cell, value: "", notes: [] } : cell
        )
      );
      const counts = countDigits(newBoard);
      newBoard = newBoard.map((r) =>
        r.map((cell) => ({
          ...cell,
          completedDigit: counts[cell.value] === 9,
          completionId: counts[cell.value] === 9 ? cell.completionId : null,
          completionIsFinal: false,
        }))
      );
      return newBoard;
    });
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
    const boardData = markCompleted(
      next.puzzle.map((row) =>
        row.map((cell) => ({
          ...cell,
          completedDigit: false,
          completionId: null,
          completionIsFinal: false,
        }))
      )
    );
    setBoard(boardData);
    setSelected([null, null]);
    setCompleted(false);
    setCorrect(false);
    setSecondsElapsed(0);
    setTimerActive(true);
    setRecorded(false);
    setSeedInputMode(false);
    setSeedText("");
    if (user) {
      const resGame = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          puzzleSeed: next.seed,
          difficulty,
          board: boardToArray(next.puzzle.map((row) => row.map((c) => ({ ...c })))),
        }),
      });
      const g = await resGame.json();
      setGameId(g.id);
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
    if (!board) return;
    const filled = board.flat().filter((c) => c.value).length;
    setProgress((filled / 81) * 100);
  }, [board]);

  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => {
      setSecondsElapsed((secs) => secs + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  useEffect(() => {
    if (user && gameId && board) {
      fetch(`/api/games/${gameId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          board: boardToArray(board),
          secondsElapsed,
        }),
      });
    }
  }, [board, secondsElapsed, user, gameId]);

  useEffect(() => {
    if (completed && correct) {
      setTimerActive(false);
      if (user && gameId && !recorded) {
        fetch(`/api/games/${gameId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            completed: true,
            time: secondsElapsed,
            completedAt: true,
          }),
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

  function moveSelection(dr, dc) {
    setSelected(([r, c]) => {
      const row = r === null ? 0 : Math.min(8, Math.max(0, r + dr));
      const col = c === null ? 0 : Math.min(8, Math.max(0, c + dc));
      return [row, col];
    });
  }

  useEffect(() => {
    function handleKey(e) {
      if (stage !== "play") return;
      const targetTag = e.target.tagName;
      if (targetTag === "INPUT" || targetTag === "TEXTAREA") return;
      if (/^[1-9]$/.test(e.key)) {
        handleNumberInput(e.key);
      } else if (e.key === "Backspace" || e.key === "Delete") {
        handleErase();
      } else if (e.key === " ") {
        e.preventDefault();
        setNoteMode((n) => !n);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        moveSelection(-1, 0);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        moveSelection(1, 0);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        moveSelection(0, -1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        moveSelection(0, 1);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [stage, selected, noteMode]); // eslint-disable-line react-hooks/exhaustive-deps

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
      <BackgroundProgress progress={progress} />
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
            <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
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
            </div>
            <div className="flex items-center justify-center gap-2 mb-4">
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
                  animate={{ opacity: [1, 1, 1, 1, 1, 0], y: [0] }}
                  transition={{ ease: "easeInOut", duration: 8 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute -top-12 px-6 py-3 bg-green-200 text-green-800 rounded shadow text-xl font-bold"
                  style={{
                    zIndex: '1'
                  }}
                >

                  🎉 You solved it!

                  <Confetti
                    height={window.innerHeight}
                    numberOfPieces={100}
                    recycle={false}
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      width: '100vw',
                      zIndex: '0'
                    }}
                  />
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

