// Reordering the steps of the mobile timeline with a finger (docs/specs/scene-editor-mobile.md,
// E.9): a long press on a step lifts it, it then follows the finger and the other steps make room;
// releasing drops it there. A press that moves before the delay is a scroll or a swipe, and is left
// alone. The page scrolls by itself when the finger nears its top or its bottom.
//
// Touch events only: "touchmove" is the one event whose default (the scroll) can still be
// prevented once the press has turned into a drag. The mode "Reorder steps" of the menu remains the
// equivalent without a gesture.

const LONG_PRESS_MS = 380;
const MOVE_TOLERANCE_PX = 8;
const AUTO_SCROLL_ZONE_PX = 64;
// slow at the edge of the zone, faster as the finger goes on (the speed grows with the square)
const AUTO_SCROLL_MAX_PX_PER_FRAME = 12;
// the click the browser sends when the finger lifts is the end of the drag, not a tap on the row
const CLICK_AFTER_DRAG_MS = 400;

const DRAGGING_BODY_CLASS = 'gladys-step-dragging';

const isStepDragging = () => typeof document !== 'undefined' && document.body.classList.contains(DRAGGING_BODY_CLASS);

/**
 * @description Makes the steps of a timeline draggable after a long press.
 * @param {Object} options - The options.
 * @param {string} options.itemSelector - Matches the steps, direct children of the container.
 * @param {string} options.draggingClass - Set on the step being dragged.
 * @param {string} options.shiftingClass - Set on the container while a step is dragged.
 * @param {Function} options.onMove - Called with (fromIndex, toIndex) when a step is dropped at
 * another place; may return a promise, the steps keep their place until it resolves.
 * @returns {Object} The controller: attach(container) and detach().
 * @example
 * const drag = createTimelineDrag({ itemSelector: '[data-step]', draggingClass, shiftingClass, onMove });
 * drag.attach(element);
 */
const createTimelineDrag = ({ itemSelector, draggingClass, shiftingClass, onMove }) => {
  let container = null;
  let press = null;
  let drag = null;
  let draggedAt = 0;
  let scrollFrame = null;

  const getItems = () => Array.from(container.children).filter(element => element.matches(itemSelector));

  const clearPress = () => {
    if (press) {
      clearTimeout(press.timer);
      press = null;
    }
  };

  const applyPosition = () => {
    if (!drag) {
      return;
    }
    const offset = drag.pageY - drag.startPageY;
    const draggedMiddle = drag.middles[drag.from] + offset;
    let to = drag.from;
    drag.items.forEach((item, index) => {
      if (index === drag.from) {
        return;
      }
      let shift = 0;
      if (index > drag.from && draggedMiddle > drag.middles[index]) {
        shift = -drag.height;
        to = Math.max(to, index);
      } else if (index < drag.from && draggedMiddle < drag.middles[index]) {
        shift = drag.height;
        to = Math.min(to, index);
      }
      item.style.transform = shift ? `translateY(${shift}px)` : '';
    });
    drag.to = to;
    // the step stays between the first and the last place it can take
    const min = drag.tops[0] - drag.tops[drag.from];
    const max = drag.bottoms[drag.items.length - 1] - drag.bottoms[drag.from];
    drag.element.style.transform = `translateY(${Math.max(min - 12, Math.min(max + 12, offset))}px)`;
  };

  const autoScroll = () => {
    scrollFrame = null;
    if (!drag) {
      return;
    }
    // near an edge of the visible timeline, and only once the finger has gone that way: a step
    // picked up close to the bottom bar must not run away by itself
    const top = drag.topInset + AUTO_SCROLL_ZONE_PX;
    const bottom = window.innerHeight - drag.bottomInset - AUTO_SCROLL_ZONE_PX;
    let speed = 0;
    if (drag.clientY < top && drag.clientY < drag.startClientY - MOVE_TOLERANCE_PX) {
      speed = -(Math.min(1, (top - drag.clientY) / AUTO_SCROLL_ZONE_PX) ** 2);
    } else if (drag.clientY > bottom && drag.clientY > drag.startClientY + MOVE_TOLERANCE_PX) {
      speed = Math.min(1, (drag.clientY - bottom) / AUTO_SCROLL_ZONE_PX) ** 2;
    }
    if (speed !== 0) {
      const before = window.scrollY;
      window.scrollBy(0, speed * AUTO_SCROLL_MAX_PX_PER_FRAME);
      const scrolled = window.scrollY - before;
      if (scrolled !== 0) {
        drag.pageY += scrolled;
        applyPosition();
      }
    }
    scrollFrame = window.requestAnimationFrame(autoScroll);
  };

  const startDrag = () => {
    const { element, pageY, clientY } = press;
    press = null;
    const items = getItems();
    const from = items.indexOf(element);
    if (from < 0 || items.length < 2) {
      return;
    }
    const rects = items.map(item => item.getBoundingClientRect());
    const tops = rects.map(rect => rect.top + window.scrollY);
    const bottoms = rects.map(rect => rect.bottom + window.scrollY);
    drag = {
      element,
      items,
      from,
      to: from,
      tops,
      bottoms,
      middles: rects.map((rect, index) => (tops[index] + bottoms[index]) / 2),
      height: rects[from].height,
      startPageY: pageY,
      pageY,
      clientY,
      startClientY: clientY,
      // the bars of the page cover its top and its bottom
      topInset: 56,
      bottomInset: 84
    };
    element.classList.add(draggingClass);
    container.classList.add(shiftingClass);
    document.body.classList.add(DRAGGING_BODY_CLASS);
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(10);
    }
    scrollFrame = window.requestAnimationFrame(autoScroll);
  };

  const endDrag = async drop => {
    const finished = drag;
    if (!finished) {
      return;
    }
    drag = null;
    draggedAt = Date.now();
    if (scrollFrame !== null) {
      window.cancelAnimationFrame(scrollFrame);
      scrollFrame = null;
    }
    document.body.classList.remove(DRAGGING_BODY_CLASS);
    try {
      if (drop && finished.to !== finished.from) {
        // the steps stay where the finger left them until the scene holds the new order
        await onMove(finished.from, finished.to);
      }
    } finally {
      // back to the layout, which is now in the new order: no transition, or the steps would
      // slide a second time
      finished.items.forEach(item => {
        item.style.transition = 'none';
        item.style.transform = '';
      });
      finished.element.classList.remove(draggingClass);
      if (container) {
        container.classList.remove(shiftingClass);
        // eslint-disable-next-line no-unused-expressions
        container.offsetHeight;
      }
      finished.items.forEach(item => {
        item.style.transition = '';
      });
    }
  };

  const onTouchStart = event => {
    clearPress();
    if (drag || event.touches.length !== 1) {
      return;
    }
    const element = getItems().find(item => item.contains(event.target));
    if (!element) {
      return;
    }
    const touch = event.touches[0];
    press = {
      element,
      clientX: touch.clientX,
      clientY: touch.clientY,
      pageY: touch.pageY,
      timer: setTimeout(startDrag, LONG_PRESS_MS)
    };
  };

  const onTouchMove = event => {
    const touch = event.touches[0];
    if (drag) {
      if (event.cancelable) {
        event.preventDefault();
      }
      drag.clientY = touch.clientY;
      drag.pageY = touch.pageY;
      applyPosition();
      return;
    }
    if (
      press &&
      (Math.abs(touch.clientX - press.clientX) > MOVE_TOLERANCE_PX ||
        Math.abs(touch.clientY - press.clientY) > MOVE_TOLERANCE_PX)
    ) {
      clearPress();
    }
  };

  const onTouchEnd = () => {
    clearPress();
    endDrag(true);
  };

  const onTouchCancel = () => {
    clearPress();
    endDrag(false);
  };

  // the menu a long press opens on some browsers, and the click that ends the drag
  const onContextMenu = event => {
    if (press || drag) {
      event.preventDefault();
    }
  };

  const onClickCapture = event => {
    if (drag || Date.now() - draggedAt < CLICK_AFTER_DRAG_MS) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const detach = () => {
    clearPress();
    endDrag(false);
    if (container) {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchCancel);
      container.removeEventListener('contextmenu', onContextMenu);
      container.removeEventListener('click', onClickCapture, true);
      container = null;
    }
  };

  const attach = element => {
    if (element === container) {
      return;
    }
    detach();
    if (!element) {
      return;
    }
    container = element;
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);
    container.addEventListener('touchcancel', onTouchCancel);
    container.addEventListener('contextmenu', onContextMenu);
    container.addEventListener('click', onClickCapture, true);
  };

  return { attach, detach };
};

export { createTimelineDrag, isStepDragging };
