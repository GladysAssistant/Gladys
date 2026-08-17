// Drop-placement math for the editor canvas, shared by the hover feedback
// and the drop itself (both must agree on where a widget would land).
//
// Best-practice placement (see the spec): there are no dedicated drop-zone
// elements at all — the droppable surfaces are the columns themselves plus
// the whole section row as a catch-all, and the insertion point is computed
// from the pointer position. Feedback is an overlay indicator line in the
// gap where the widget would land plus a tint on the destination column, so
// starting a drag never shifts the layout.

const INDICATOR_THICKNESS_PX = 4;
const INDICATOR_GAP_OFFSET_PX = 5;

// A drop lands in a column: pointing directly at one wins, pointing at the
// section (between/below short columns) resolves to the nearest column
// horizontally, so the whole section area is usable.
const resolveColumn = (target, point) => {
  if (target.hasAttribute('data-widget-drop')) {
    return target;
  }
  const columns = Array.from(target.querySelectorAll('[data-widget-drop]'));
  let best = null;
  let bestDistance = Infinity;
  columns.forEach(columnElement => {
    const rect = columnElement.getBoundingClientRect();
    let distance = 0;
    if (point.x < rect.left) {
      distance = rect.left - point.x;
    } else if (point.x > rect.right) {
      distance = point.x - rect.right;
    }
    if (distance < bestDistance) {
      bestDistance = distance;
      best = columnElement;
    }
  });
  return best;
};

// Insertion index: before the first widget whose vertical middle is below
// the pointer, at the end otherwise (the standard list insertion rule).
const computePlacement = (target, point) => {
  const columnElement = resolveColumn(target, point);
  if (!columnElement) {
    return null;
  }
  const x = Number(columnElement.getAttribute('data-drop-x'));
  const wrappers = Array.from(columnElement.querySelectorAll('[data-widget-wrapper]'));
  let index = wrappers.length;
  for (let i = 0; i < wrappers.length; i += 1) {
    const rect = wrappers[i].getBoundingClientRect();
    if (point.y < rect.top + rect.height / 2) {
      index = i;
      break;
    }
  }
  return { columnElement, x, index, wrappers };
};

const isNoopPlacement = (placement, sourceX, sourceY) =>
  placement.x === sourceX && (placement.index === sourceY || placement.index === sourceY + 1);

const indicatorRect = ({ columnElement, wrappers, index }) => {
  const columnRect = columnElement.getBoundingClientRect();
  let top;
  if (index === 0) {
    top = wrappers[0].getBoundingClientRect().top - INDICATOR_GAP_OFFSET_PX;
  } else if (index === wrappers.length) {
    top = wrappers[wrappers.length - 1].getBoundingClientRect().bottom + INDICATOR_GAP_OFFSET_PX;
  } else {
    top = (wrappers[index - 1].getBoundingClientRect().bottom + wrappers[index].getBoundingClientRect().top) / 2;
  }
  return {
    left: columnRect.left,
    top: top - INDICATOR_THICKNESS_PX / 2,
    width: columnRect.width,
    height: INDICATOR_THICKNESS_PX
  };
};

// Hover feedback for the pointer-drag engine: destination column as the
// tinted area, indicator line at the insertion gap. No line when the column
// is empty (no relative placement — the tint alone says "lands here") or
// when the drop would leave the widget where it already is.
const resolveWidgetDropHover = (target, point, sourceX, sourceY) => {
  const placement = computePlacement(target, point);
  if (!placement) {
    return null;
  }
  const showLine = placement.wrappers.length > 0 && !isNoopPlacement(placement, sourceX, sourceY);
  return { area: placement.columnElement, indicator: showLine ? indicatorRect(placement) : null };
};

// Destination for an actual drop, or null for a no-op. When moving down
// inside the same column the removal shifts the indices below the source,
// so the insertion index is adjusted to land where the indicator showed.
const resolveWidgetDropDestination = (target, point, sourceX, sourceY) => {
  const placement = computePlacement(target, point);
  if (!placement || isNoopPlacement(placement, sourceX, sourceY)) {
    return null;
  }
  let destinationY = placement.index;
  if (placement.x === sourceX && placement.index > sourceY) {
    destinationY -= 1;
  }
  return { x: placement.x, y: destinationY };
};

export { resolveWidgetDropHover, resolveWidgetDropDestination };
