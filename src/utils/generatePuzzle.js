import { getSudoku } from "sudoku-gen";

// Convert puzzle string to 2D array
export function stringToGrid(str) {
  return Array.from({ length: 9 }, (_, i) =>
    str.slice(i * 9, (i + 1) * 9).split("").map(v => (v === "-" ? "" : v))
  );
}

export function gridToString(grid) {
  return grid.map(row => row.map(v => (v === "" ? "-" : v)).join(""))
    .join("");
}

export function generatePuzzle(difficulty = "easy") {
  const { puzzle, solution } = getSudoku(difficulty);
  return {
    puzzle: stringToGrid(puzzle),
    solution: stringToGrid(solution),
  };
}