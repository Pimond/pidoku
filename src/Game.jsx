import React, { useState, useEffect } from "react";
import Board from "./components/Board";
import NumberPad from "./components/NumberPad";
import { generatePuzzle } from "./utils/generatePuzzle";
import Confetti from "react-confetti";
import { useAuth } from "./AuthProvider";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "./firebase";

function getInitialPuzzle() {
  const next = generatePuzzle("easy");
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
  const [{ puzzle, solution }, setPuzzleData] = useState(getInitialPuzzle());
  const [board, setBoard] = useState(puzzle.map((row) => [...row]));
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
    const next = generatePuzzle("easy");
    const newPuzzle = next.puzzle.map((row) =>
      row.map((cell) => ({
        value: cell,
        notes: [],
        fixed: cell !== "",
      }))
    );
    setPuzzleData({ puzzle: newPuzzle, solution: next.solution });
    setBoard(newPuzzle.map((row) => row.map((cell) => ({ ...cell }))));
    setSelected([null, null]);
    setCompleted(false);
    setCorrect(false);
    setSecondsElapsed(0);
    setTimerActive(true);
    setRecorded(false);
  }

  function checkCompletion() {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (!board[i][j].value) return false;
      }
    }
    return true;
  }

  function checkCorrect() {
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
  }, [board, solution]);

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
          difficulty: "easy",
          time: secondsElapsed,
          completedAt: serverTimestamp(),
        });
        setRecorded(true);
      }
    }
  }, [completed, correct, user, secondsElapsed, recorded]);

  const selectedCellNotes =
    selected[0] !== null && selected[1] !== null
      ? board[selected[0]][selected[1]].notes
      : [];

  return (
    <div className="p-4 flex flex-col items-center">
      <button
        onClick={handleNewPuzzle}
        className="mb-4 px-4 py-2 bg-blue-200 hover:bg-blue-300 rounded font-bold"
      >
        New Puzzle
      </button>
      {completed && correct && (
        <>
          <Confetti width={window.innerWidth} height={window.innerHeight} numberOfPieces={400} />
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
      <Board board={board} selected={selected} onCellSelect={handleCellSelect} />
      <NumberPad
        onInput={handleNumberInput}
        onErase={handleErase}
        noteMode={noteMode}
        onToggleNoteMode={() => setNoteMode((x) => !x)}
        highlightedNotes={noteMode ? selectedCellNotes : []}
      />
    </div>
  );
}

