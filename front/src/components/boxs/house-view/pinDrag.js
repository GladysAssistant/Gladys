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

export const clampPercent = value => Math.min(100, Math.max(0, Math.round(value * 10) / 10));

// Pointer position as a percentage of the image box, which is how pins are
// stored so they scale with the illustration.
export const percentFromPointer = (rect, clientX, clientY) => ({
  x_pct: clampPercent(((clientX - rect.left) / rect.width) * 100),
  y_pct: clampPercent(((clientY - rect.top) / rect.height) * 100)
});

const startPinDrag = (event, options) => {
  // event.button is 0 for touch, pen and the main mouse button
  if (event.button > 0) {
    return;
  }
  const { getImageRect, onMove, onDrop, onCancel, draggingClass } = options;
  const marker = event.currentTarget;
  const { pointerId } = event;
  // the pin sits on top of the image, whose click handler adds a pin: the
  // gesture must never reach it
  event.preventDefault();
  event.stopPropagation();

  let started = false;
  let position = null;

  // with pointer capture the gesture keeps working when the pointer leaves
  // the image — or the window
  try {
    marker.setPointerCapture(pointerId);
  } catch (e) {} // eslint-disable-line no-empty

  const cleanup = () => {
    window.removeEventListener('pointermove', onPointerMove, true);
    window.removeEventListener('pointerup', onPointerUp, true);
    window.removeEventListener('pointercancel', onPointerCancel, true);
    window.removeEventListener('keydown', onKeyDown, true);
    if (started && draggingClass) {
      marker.classList.remove(draggingClass);
    }
    try {
      marker.releasePointerCapture(pointerId);
    } catch (e) {} // eslint-disable-line no-empty
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

  window.addEventListener('pointermove', onPointerMove, true);
  window.addEventListener('pointerup', onPointerUp, true);
  window.addEventListener('pointercancel', onPointerCancel, true);
  window.addEventListener('keydown', onKeyDown, true);
};

export { startPinDrag };
