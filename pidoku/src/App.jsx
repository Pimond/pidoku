import React, { useState, useEffect } from "react";
import Board from "./components/Board";
import NumberPad from "./components/NumberPad";
import { generatePuzzle } from "./utils/generatePuzzle";
import Confetti from "react-confetti";

function getInitialPuzzle() {
  const next = generatePuzzle("easy"); // or "medium" etc.
  const puzzle = next.puzzle.map((row) =>
    row.map((cell) => ({
      value: cell,
      notes: [],
      fixed: cell !== ""
    }))
  );
  return { puzzle, solution: next.solution };
}

function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export default function App() {
  const [{ puzzle, solution }, setPuzzleData] = useState(getInitialPuzzle());
  const [board, setBoard] = useState(puzzle.map(row => [...row]));
  const [selected, setSelected] = useState([null, null]);
  const [noteMode, setNoteMode] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(true);


  // Cells that can't be edited (the clues)
  const isFixed = (row, col) => puzzle[row][col] !== "";

  function handleCellChange(row, col, value) {
    if (isFixed(row, col)) return;
    setBoard(prev =>
      prev.map((r, i) =>
        r.map((cell, j) => (i === row && j === col ? value : cell))
      )
    );
  }

  function handleCellSelect(row, col) {
    setSelected([row, col]);
  }

  function handleNumberInput(val) {
    const [row, col] = selected;
    if (row === null || col === null) return;
    setBoard(prev =>
      prev.map((r, i) =>
        r.map((cell, j) => {
          if (i !== row || j !== col || cell.fixed) return cell;
          if (noteMode) {
            // Toggle note in notes array
            const notes = cell.notes.includes(val)
              ? cell.notes.filter(n => n !== val)
              : [...cell.notes, val].sort();
            return { ...cell, notes };
          } else {
            return { ...cell, value: val, notes: [] }; // Clear notes when writing value
          }
        })
      )
    );
  }

  function handleErase() {
    const [row, col] = selected;
    if (row === null || col === null) return;
    setBoard(prev =>
      prev.map((r, i) =>
        r.map((cell, j) =>
          i === row && j === col && !cell.fixed
            ? { ...cell, value: "", notes: [] }
            : cell
        )
      )
    );
  }



  function handleNewPuzzle() {
    const next = generatePuzzle("easy"); // Change as needed
    const newPuzzle = next.puzzle.map((row) =>
      row.map((cell) => ({
        value: cell,
        notes: [],
        fixed: cell !== ""
      }))
    );
    setPuzzleData({ puzzle: newPuzzle, solution: next.solution });
    setBoard(newPuzzle.map(row => row.map(cell => ({ ...cell }))));
    setSelected([null, null]);
    setCompleted(false);
    setCorrect(false);
    setSecondsElapsed(0);
    setTimerActive(true);
  }

  function checkCompletion() {
  // Returns true if every cell has a value
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (!board[i][j].value) {
        return false;
      }
    }
  }
  return true;
}

function checkCorrect() {
  // Compare board to solution
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (board[i][j].value !== (solution[i][j] || "")) {
        return false;
      }
    }
  }
  return true;
}

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
  }
}, [completed, correct]);


  return (
    <div className="min-h-screen bg-gray-50 p-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-8">Pidoku</h1>
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
      <div className="mb-4 text-xl font-mono text-gray-700">
      Time: {formatTime(secondsElapsed)}
    </div>
      <Board
        board={board}
        selected={selected}
        onCellChange={handleCellChange}
        onCellSelect={handleCellSelect}
        isFixed={isFixed}
      />

      <NumberPad
        onInput={handleNumberInput}
        onErase={handleErase}
        noteMode={noteMode}
        onToggleNoteMode={() => setNoteMode(x => !x)}
      />
    </div>
  );
}
