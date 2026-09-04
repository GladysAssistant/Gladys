// Free positioning of a house-view pin, on pointer events: one code path for
// mouse, touch and pen, and no native drag pipeline at all (same reasoning as
// utils/pointerDrag.js, but here the pin lands on a coordinate instead of a
// drop target, so it needs its own tiny engine).
//
// Nothing re-renders while the gesture runs: the marker is moved through its
// own inline style, and the box config is only updated on drop.

// Below this movement the gesture is a click, not a drag — a plain click on a
// pin must stay harmless (it must not nudge the pin by a pixel).
const DRAG_START_THRESHOLD_PX = 4;

// One pin drag at a time: a second pointer (another finger, a mouse button
// pressed during a touch drag) must not stack a second set of listeners.
let dragInProgress = false;

export const clampPercent = value => Math.min(100, Math.max(0, Math.round(value * 10) / 10));

// Pointer position as a percentage of the image box, which is how pins are
// stored so they scale with the illustration.
export const percentFromPointer = (rect, clientX, clientY) => ({
  x_pct: clampPercent(((clientX - rect.left) / rect.width) * 100),
  y_pct: clampPercent(((clientY - rect.top) / rect.height) * 100)
});

const startPinDrag = (event, options) => {
  // event.button is 0 for touch, pen and the main mouse button; a secondary
  // touch reports button 0 too, hence the isPrimary guard
  if (dragInProgress || !event.isPrimary || event.button > 0) {
    return;
  }
  dragInProgress = true;
  const { getImageRect, getSurface, onMove, onDrop, onCancel, draggingClass } = options;
  const marker = event.currentTarget;
  const { pointerId } = event;
  // stops text selection and the native image drag, and keeps the gesture
  // from reaching any pointerdown handler further up the editor
  event.preventDefault();
  event.stopPropagation();
  // preventDefault() also cancels the browser's focus default: the marker is
  // focusable on purpose (arrow keys move the pin), so focus it by hand
  try {
    marker.focus({ preventScroll: true });
  } catch (e) {} // eslint-disable-line no-empty

  let started = false;
  let position = null;

  // with pointer capture the gesture keeps working when the pointer leaves
  // the image — or the window
  try {
    marker.setPointerCapture(pointerId);
  } catch (e) {} // eslint-disable-line no-empty

  // a click fired by the pointerup that ended a real drag must not reach the
  // app: browsers that deliver it at the drop point (a delayed iOS click)
  // would hit the image and add a pin there.
  // Scoped to the editor surface (the image and its markers), not the window:
  // the click that has to be swallowed always lands in there, while a
  // window-wide listener would also eat the first click on any other control
  // of the page during those 300 ms.
  const suppressNextClick = () => {
    const surface = getSurface && getSurface();
    if (!surface) {
      return;
    }
    const suppress = clickEvent => {
      clickEvent.preventDefault();
      clickEvent.stopPropagation();
      removeSuppress();
    };
    const removeSuppress = () => {
      surface.removeEventListener('click', suppress, true);
    };
    surface.addEventListener('click', suppress, true);
    window.setTimeout(removeSuppress, 300);
  };

  const cleanup = () => {
    window.removeEventListener('pointermove', onPointerMove, true);
    window.removeEventListener('pointerup', onPointerUp, true);
    window.removeEventListener('pointercancel', onPointerCancel, true);
    window.removeEventListener('keydown', onKeyDown, true);
    window.removeEventListener('blur', onWindowBlur);
    if (started && draggingClass) {
      marker.classList.remove(draggingClass);
    }
    try {
      marker.releasePointerCapture(pointerId);
    } catch (e) {} // eslint-disable-line no-empty
    dragInProgress = false;
  };

  const abort = () => {
    cleanup();
    if (started && onCancel) {
      onCancel(marker);
    }
  };

  const onPointerMove = moveEvent => {
    if (moveEvent.pointerId !== pointerId) {
      return;
    }
    if (
      !started &&
      Math.abs(moveEvent.clientX - event.clientX) < DRAG_START_THRESHOLD_PX &&
      Math.abs(moveEvent.clientY - event.clientY) < DRAG_START_THRESHOLD_PX
    ) {
      return;
    }
    if (!started) {
      started = true;
      if (draggingClass) {
        marker.classList.add(draggingClass);
      }
    }
    moveEvent.preventDefault();
    const rect = getImageRect();
    if (!rect) {
      return;
    }
    position = percentFromPointer(rect, moveEvent.clientX, moveEvent.clientY);
    onMove(marker, position);
  };

  const onPointerUp = upEvent => {
    if (upEvent.pointerId !== pointerId) {
      return;
    }
    const dropped = started && position;
    cleanup();
    if (dropped) {
      upEvent.preventDefault();
      suppressNextClick();
      onDrop(position);
    }
  };

  const onPointerCancel = cancelEvent => {
    if (cancelEvent.pointerId !== pointerId) {
      return;
    }
    abort();
  };

  // Escape puts the pin back where it was, like any well-behaved drag
  const onKeyDown = keyEvent => {
    if (keyEvent.key === 'Escape') {
      abort();
    }
  };

  // a backgrounded tab often never delivers the pointerup: without this the
  // listeners stay attached and the marker is left where the last move put it
  const onWindowBlur = () => {
    abort();
  };

  window.addEventListener('pointermove', onPointerMove, true);
  window.addEventListener('pointerup', onPointerUp, true);
  window.addEventListener('pointercancel', onPointerCancel, true);
  window.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('blur', onWindowBlur);
};

export { startPinDrag };
