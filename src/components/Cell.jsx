import { AnimatePresence, motion as Motion } from "motion/react"
function getBgColor({ isConflict, isSelected, isSameRow, isSameCol, fixed }) {
  if (isConflict) return "#fee2e2";        // bg-red-100
  if (isSelected) return "#f0f9ff";        // bg-blue-50
  if (isSameRow || isSameCol) return "#dbeafe"; // bg-blue-100
  if (fixed) return "#e5e7eb";             // bg-gray-300
  return "#fff";                           // bg-white
}
export default function Cell({
  cell,
  row,
  col,
  isSelected,
  isSameValue,
  isSameRow,
  isSameCol,
  onSelect,
  isConflict
}) {
  const { value, notes, fixed } = cell;

  let bg = "bg-white";
  let text = "text-blue-500";
  let font = ""
  if (isConflict && isSelected) {
    text = "text-red-600";
  } else if (isConflict) {
    text = "text-red-700";
  } else if (fixed) {
    text = "text-gray-800";
  }

  if (isSelected) {
    font = "font-bold"
  } else if (isSameValue) {
    font = "font-bold"
  }

  if (isSelected) {
    bg = "bg-blue-20";
  } else if (isSameRow || isSameCol) {
    bg = "bg-blue-100";
  } else if (fixed) {
    bg = "bg-gray-300"
  }


  const highlight = `${bg} ${text}`;

  const base =
    "w-12 h-12 text-center text-lg cursor-pointer relative flex items-center justify-center";
  const border =
    `border 
    ${col % 3 === 0 ? "border-l-2" : "border-l"} 
    ${row % 3 === 0 ? "border-t-2" : "border-t"} 
    ${col === 8 ? "border-r-2" : ""} 
    ${row === 8 ? "border-b-2" : ""} 
    border-gray-400`;

  return (
    <Motion.div
      animate={{ backgroundColor: getBgColor({ isConflict, isSelected, isSameRow, isSameCol, fixed: cell.fixed }) }}
      transition={{ duration: 0.2 }}
      className={`${base} ${border} ${highlight}`}
      onClick={() => onSelect(row, col)}
      tabIndex={0}
      role="button"
      aria-label={`Cell ${row + 1},${col + 1}`}>

      {value ? (
        <AnimatePresence mode="wait">

          <Motion.div
            key={cell.value}
            initial={{ scale: 0, transition: { delay: 0.9, duration: 1 } }} animate={{ scale: 1, x: isConflict && cell.value ? [0, -4, 4, -4, 4, 0] : 0 }}
            exit={{ scale: 0, opacity: 0, transition: { duration: 0.15 } }}
            transition={{
              x: isConflict && cell.value
                ? { duration: 0.3, times: [0, 0.2, 0.4, 0.6, 0.8, 1], ease: "easeInOut" }
                : {},
              scale: { type: "spring", duration: 0.18 },
              opacity: { duration: 0.13 }
            }}
            whileHover={{ scale: 1.2, transition: { delay: 0, duration: 0.1 } }}
            whileTap={{ scale: 0.95, transition: { delay: 0, duration: 0.1 } }} >

            <Motion.span className={`text-2xl ${text} ${font}`}>{value}</Motion.span>

          </Motion.div>
        </AnimatePresence >

      ) : notes && notes.length > 0 ? (
        <Motion.div
          className="absolute inset-0 grid grid-cols-3 grid-rows-3 text-xs p-0.6 text-gray-600">
            {Array.from({ length: 9 }).map((_, i) =>
              notes.includes((i + 1).toString()) ? (
                <Motion.span


                  key={i} className="flex items-center justify-center">
                  {i + 1}
                </Motion.span>
              ) : (
                <Motion.span

                  key={i}></Motion.span>
              )

            )}
        </Motion.div>

      ) : null}

    </Motion.div>
  );
}
