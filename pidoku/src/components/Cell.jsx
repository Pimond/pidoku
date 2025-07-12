export default function Cell({
  cell,
  row,
  col,
  isSelected,
  isSameValue,
  isSameRow,
  isSameCol,
  isSameBox,
  onSelect
}) {
  const { value, notes, fixed } = cell;

  // Compose extra highlight classes
  let highlight = "";
  if (isSelected) {
    highlight = "bg-yellow-100 font-bold text-gray-800";
  } else if (isSameValue) {
    highlight = "font-bold text-gray-800";
  } else if (isSameRow || isSameCol ) {
    highlight = "bg-blue-100";
  } else if (fixed) {
    highlight = "bg-gray-300";
  } else {
    highlight = "bg-white";
  }

  const base =
    "w-8 h-8 text-center text-lg cursor-pointer relative flex items-center justify-center";
  const border =
    `border 
    ${col % 3 === 0 ? "border-l-2" : "border-l"} 
    ${row % 3 === 0 ? "border-t-2" : "border-t"} 
    ${col === 8 ? "border-r-2" : ""} 
    ${row === 8 ? "border-b-2" : ""} 
    border-gray-400`;

  return (
    <div
      className={`${base} ${border} ${highlight}`}
      onClick={() => onSelect(row, col)}
      tabIndex={0}
      role="button"
      aria-label={`Cell ${row + 1},${col + 1}`}
    >
      {value ? (
        <span className={`text-2xl ${fixed ? "font text-gray-800" : ""}`}>{value}</span>
      ) : notes && notes.length > 0 ? (
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 text-xs p-0.5 text-gray-600">
          {Array.from({ length: 9 }).map((_, i) =>
            notes.includes((i + 1).toString()) ? (
              <span key={i} className="flex items-center justify-center">
                {i + 1}
              </span>
            ) : (
              <span key={i}></span>
            )
          )}
        </div>
      ) : null}
    </div>
  );
}
