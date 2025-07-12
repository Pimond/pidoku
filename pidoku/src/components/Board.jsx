import React from "react";
import Cell from "./Cell";

export default function Board({ board, selected, onCellChange, onCellSelect, isFixed }) {
  const [selectedRow, selectedCol] = selected;

  // Value of currently selected cell, if any
  const selectedValue =
    selectedRow !== null && selectedCol !== null
      ? board[selectedRow][selectedCol].value
      : "";

  // Helper to get box index for a cell
  const getBoxIndex = (row, col) => `${Math.floor(row / 3)}-${Math.floor(col / 3)}`;
  const selectedBox = (selectedRow !== null && selectedCol !== null)
    ? getBoxIndex(selectedRow, selectedCol)
    : null;

  return (
    <div className="inline-block bg-gray-200 p-2 rounded-md shadow-lg">
      <div className="grid grid-cols-9">
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
              isSameBox={selectedBox === getBoxIndex(rowIdx, colIdx)}
              onSelect={onCellSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}
