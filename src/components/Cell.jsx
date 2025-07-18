import { AnimatePresence, motion as Motion } from "motion/react";
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
  isConflict,
}) {
  const { value, notes, fixed, appearDelay = 0 } = cell;

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
    ${col % 3 === 0 ? "border-l-4 border-l-gray-400" : "border-l"} 
    ${row % 3 === 0 ? "border-t-4 border-t-gray-400" : "border-t"} 
    ${col === 8 ? "border-r-4 border-r-gray-400" : ""} 
    ${row === 8 ? "border-b-4 border-b-gray-400" : ""} 
    border-gray-400`;

  return (
    <Motion.div
      animate={{ backgroundColor: getBgColor({ isConflict, isSelected, isSameRow, isSameCol, fixed: cell.fixed }) }}
      transition={{ duration: 0.2 }}
      className={`${base} ${border} ${highlight} focus:outline-none`}
      onClick={() => onSelect(row, col)}
      tabIndex={0}
      role="button"
      aria-label={`Cell ${row + 1},${col + 1}`}>
      <AnimatePresence>
        {isSelected && (
          <Motion.div
            layoutId="cell-focus"
            initial={{ borderWidth: 1, opacity: 0.1 }}
            animate={{ borderWidth: 2, opacity: 0.2 }}
            transition={{ borderWidth: { type: "spring", bounce: 0.3, duration: 0.2 } }}
            className="absolute inset-0 border-black pointer-events-none z-10"
            style={{ borderStyle: "solid" }}
          />
        )}
      </AnimatePresence>
      {value ? (
        <AnimatePresence mode="wait">
          <Motion.div
            key={cell.value}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, x: isConflict ? [0, -4, 4, -4, 4, 0] : 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              delay: appearDelay,
              type: "spring",
              stiffness: 300,
              damping: 20,
              duration: 0.2,
              x: { type: "tween", duration: 0.3, ease: "easeInOut" },
            }}
          >
            <span className={`text-2xl ${text} ${font}`}>{value}</span>
          </Motion.div>
        </AnimatePresence>
      ) : notes && notes.length > 0 ? (
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 text-xs p-0.5 text-gray-600 select-none pointer-events-none">
          {Array.from({ length: 9 }).map((_, i) => {
            const num = (i + 1).toString();
            const show = notes.includes(num);
            return (
              <Motion.span
                key={num}
                animate={{ opacity: show ? 1 : 0 }}
                style={{ visibility: show ? "visible" : "hidden" }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-center"
              >
                {i + 1}
              </Motion.span>
            );
          })}
        </div>
      ) : null}


    </Motion.div>
  );
}
