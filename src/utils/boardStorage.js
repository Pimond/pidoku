export function flattenBoard(board) {
  return board.flat().map(c => ({ value: c.value, notes: c.notes, fixed: c.fixed }));
}

export function expandBoard(flat) {
  return Array.from({ length: 9 }, (_, r) => flat.slice(r * 9, (r + 1) * 9));
}
