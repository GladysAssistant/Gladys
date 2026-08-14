import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';

// Many desktop PCs and laptops now ship with a touchscreen while still being used with a
// mouse (or a pen). Detecting the touchscreen and switching to the touch backend used to
// break drag & drop with a mouse on those devices, because the touch backend only listens
// to touch events by default.
// Enabling the mouse events of the touch backend gives a unified handling of mouse, touch
// and pen input, so drag & drop works whatever the pointer used on a hybrid device.
const TOUCH_BACKEND_OPTIONS = {
  enableMouseEvents: true,
  enableTouchEvents: true,
  // On Windows, long pressing an element with a touchscreen fires a "contextmenu" event.
  // The touch backend listens to it as soon as mouse events are enabled, and would cancel
  // the drag right after it started.
  ignoreContextMenu: true
};

function isTouchDevice() {
  try {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
  } catch (e) {
    return false;
  }
}

let cachedBackend = null;

/**
 * Returns the react-dnd backend and the options to give to a DndProvider.
 *
 * react-dnd keeps one single drag & drop manager per window: the first mounted DndProvider
 * wins, so every DndProvider of the app must use this helper to stay consistent.
 */
function getDragAndDropBackend() {
  if (cachedBackend === null) {
    cachedBackend = isTouchDevice()
      ? { backend: TouchBackend, options: TOUCH_BACKEND_OPTIONS }
      : { backend: HTML5Backend, options: undefined };
  }
  return cachedBackend;
}

export { TOUCH_BACKEND_OPTIONS, getDragAndDropBackend, isTouchDevice };
