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

// Insertion index in a vertical stack of elements: before the first one
// whose vertical middle is below the pointer, at the end otherwise (the
// standard list insertion rule). Shared with the dashboard-list reorder.
const computeInsertionIndex = (elements, pointerY) => {
  let index = elements.length;
  for (let i = 0; i < elements.length; i += 1) {
    const rect = elements[i].getBoundingClientRect();
    if (pointerY < rect.top + rect.height / 2) {
      index = i;
      break;
    }
  }
  return index;
};

// Viewport rect of the indicator line for inserting at `index` in a vertical
// stack: centered in the gap between neighbors, spanning the container width.
// An empty stack anchors the line at the top of the container — callers may
// reach this directly (dashboard-list reorder), not only through the
// widget-hover path that filters empty columns out.
const insertionLineRect = (containerRect, elements, index) => {
  let top;
  if (elements.length === 0) {
    top = containerRect.top + INDICATOR_GAP_OFFSET_PX;
  } else if (index === 0) {
    top = elements[0].getBoundingClientRect().top - INDICATOR_GAP_OFFSET_PX;
  } else if (index === elements.length) {
    top = elements[elements.length - 1].getBoundingClientRect().bottom + INDICATOR_GAP_OFFSET_PX;
  } else {
    top = (elements[index - 1].getBoundingClientRect().bottom + elements[index].getBoundingClientRect().top) / 2;
  }
  return {
    left: containerRect.left,
    top: top - INDICATOR_THICKNESS_PX / 2,
    width: containerRect.width,
    height: INDICATOR_THICKNESS_PX
  };
};

// Insertion index in a wrapping row of pills (the editor's dashboard bar),
// in reading order: before the first pill whose row is below the pointer,
// or — within the pointed row — the first pill whose horizontal middle is
// past the pointer. Past the end of a row, the next pill starts the next
// row and its top is below the pointer, so "end of row N" and "start of
// row N+1" resolve to the same index, as they should.
const computeFlowInsertionIndex = (elements, point) => {
  let index = elements.length;
  for (let i = 0; i < elements.length; i += 1) {
    const rect = elements[i].getBoundingClientRect();
    if (point.y < rect.top || (point.y <= rect.bottom && point.x < rect.left + rect.width / 2)) {
      index = i;
      break;
    }
  }
  return index;
};

// Viewport rect of the indicator for inserting at `index` in a wrapping
// row: a short vertical line in the gap before the pill at `index` (after
// the last one at the end), the height of its neighbor.
const flowInsertionLineRect = (containerRect, elements, index) => {
  if (elements.length === 0) {
    return {
      left: containerRect.left + INDICATOR_GAP_OFFSET_PX,
      top: containerRect.top,
      width: INDICATOR_THICKNESS_PX,
      height: containerRect.height
    };
  }
  const neighbor =
    index === elements.length
      ? elements[elements.length - 1].getBoundingClientRect()
      : elements[index].getBoundingClientRect();
  const left =
    index === elements.length ? neighbor.right + INDICATOR_GAP_OFFSET_PX : neighbor.left - INDICATOR_GAP_OFFSET_PX;
  return {
    left: left - INDICATOR_THICKNESS_PX / 2,
    top: neighbor.top,
    width: INDICATOR_THICKNESS_PX,
    height: neighbor.height
  };
};

const computePlacement = (target, point) => {
  const columnElement = resolveColumn(target, point);
  if (!columnElement) {
    return null;
  }
  const x = Number(columnElement.getAttribute('data-drop-x'));
  // a missing or malformed attribute must read as "no destination", not as
  // boxes[NaN] downstream (NaN passes every < / >= bound check)
  if (!Number.isFinite(x)) {
    return null;
  }
  const wrappers = Array.from(columnElement.querySelectorAll('[data-widget-wrapper]'));
  return { columnElement, x, index: computeInsertionIndex(wrappers, point.y), wrappers };
};

const isNoopPlacement = (placement, sourceX, sourceY) =>
  placement.x === sourceX && (placement.index === sourceY || placement.index === sourceY + 1);

const indicatorRect = ({ columnElement, wrappers, index }) =>
  insertionLineRect(columnElement.getBoundingClientRect(), wrappers, index);

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

export {
  computeInsertionIndex,
  insertionLineRect,
  computeFlowInsertionIndex,
  flowInsertionLineRect,
  resolveWidgetDropHover,
  resolveWidgetDropDestination
};
