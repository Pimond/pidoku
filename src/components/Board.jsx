import React from "react";
import Cell from "./Cell";

export default function Board({ board, selected, onCellSelect }) {
  const [selectedRow, selectedCol] = selected;

  // Value of currently selected cell, if any
  const selectedValue =
    selectedRow !== null && selectedCol !== null
      ? board[selectedRow][selectedCol].value
      : "";
  function hasConflict(board, row, col) {
    const val = board[row][col].value;
    if (!val) return false;

    // Check row
    for (let c = 0; c < 9; c++) {
      if (c !== col && board[row][c].value === val) return true;
    }
    // Check col
    for (let r = 0; r < 9; r++) {
      if (r !== row && board[r][col].value === val) return true;
    }
    // Check box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        if ((r !== row || c !== col) && board[r][c].value === val) return true;
      }
    }
    return false;
  }

  return (
    <div className=" bg-gray-200 rounded-md shadow-lg select-none w-full self-start">
      <div className="grid grid-cols-9 w-full aspect-square self-start">
        {board.map((row, rowIdx) =>
          row.map((cell, colIdx) => (
            <Cell
              key={`${rowIdx}-${colIdx}`}
              cell={cell}
              row={rowIdx}
              col={colIdx}
              isSelected={selected && selected[0] === rowIdx && selected[1] === colIdx}
              isSameValue={selectedValue && cell.value === selectedValue && cell.value !== "" && !(selected && selected[0] === rowIdx && selected[1] === colIdx)}
              isSameRow={selectedRow === rowIdx}
              isSameCol={selectedCol === colIdx}
              isConflict={hasConflict(board, rowIdx, colIdx)}
              onSelect={onCellSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}
