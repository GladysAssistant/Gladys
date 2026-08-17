// Pointer-events drag & drop engine.
//
// The dashboard editor used to drive drag & drop through react-dnd and the
// native HTML5 drag API. That stack proved impossible to make reliable:
// Chrome cancels a native drag when the DOM changes while dragstart is being
// processed, Safari rasterizes a blank drag image for backdrop-filter cards,
// touch devices have no native drag at all (hence a backend-picking
// heuristic), and react-dnd itself is unmaintained (16.0.1 is the last
// release, June 2022). Pointer events sidestep every one of those problems:
// one code path for mouse, touch and pen, no native drag pipeline at all,
// and the whole gesture is driven by plain listeners — fully testable.
//
// Nothing re-renders while a drag is in progress: the ghost is a plain DOM
// node, highlights are classList toggles, and the app state only changes on
// drop. The frameworks (preact included) are out of the hot path entirely.
//
// Usage: call startPointerDrag(event, options) from a pointerdown handler on
// the drag handle (give the handle `touch-action: none` so touch gestures
// don't scroll instead). Drop targets are DOM elements matching
// options.dropSelector; each may name its own highlight class through a
// `data-drop-active-class` attribute. What a drop MEANS is decided by the
// caller in onDrop(targetElement), from the target's data attributes.

// Below this movement, the gesture is a click, not a drag: the click goes
// through untouched (lists rely on it to navigate).
const DRAG_START_THRESHOLD_PX = 5;
// Auto-scroll when the pointer hovers the top/bottom edge of the scroll
// container — the native drag gave that for free, so must we.
const EDGE_SCROLL_ZONE_PX = 90;
const EDGE_SCROLL_MAX_SPEED_PX = 20;

// While a drag is live the body carries this class (grabbing cursor, no text
// selection), plus the caller's bodyClass (used to reveal drop zones).
const BODY_DRAGGING_CLASS = 'gladys-pointer-dragging';

// One drag at a time: a second finger or a second button press is ignored.
let dragInProgress = false;

const findScrollContainer = element => {
  let node = element ? element.parentElement : null;
  // body/html often carry overflow-y: auto without being the real scroller:
  // page scrolling belongs to document.scrollingElement, only inner panels count here
  while (node && node !== document.body && node !== document.documentElement) {
    const computed = window.getComputedStyle(node);
    if ((computed.overflowY === 'auto' || computed.overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  return document.scrollingElement || document.documentElement;
};

const startPointerDrag = (event, options) => {
  // event.button is 0 for touch, pen and the main mouse button
  if (dragInProgress || event.button > 0) {
    return;
  }
  dragInProgress = true;
  // stops text selection and any native drag the browser might start
  event.preventDefault();

  const handle = event.currentTarget;
  const { pointerId } = event;
  const { source, draggingClass, dropSelector, ghostClass, ghostIconClass, ghostLabel, bodyClass, onDrop } = options;

  const startX = event.clientX;
  const startY = event.clientY;
  let lastX = startX;
  let lastY = startY;
  let started = false;
  let ghost = null;
  let activeTarget = null;
  let activeTargetClass = null;
  let rafId = null;
  let scrollContainer = null;

  // with pointer capture, the gesture keeps working even when the pointer
  // leaves the window
  try {
    handle.setPointerCapture(pointerId);
  } catch (e) {} // eslint-disable-line no-empty

  const positionGhost = () => {
    if (ghost) {
      ghost.style.transform = `translate(${lastX}px, ${lastY}px)`;
    }
  };

  const clearTargetHighlight = () => {
    if (activeTarget && activeTargetClass) {
      activeTarget.classList.remove(activeTargetClass);
    }
    activeTarget = null;
    activeTargetClass = null;
  };

  const updateTarget = () => {
    // the ghost has pointer-events: none, so it never masks the target
    const under = document.elementFromPoint(lastX, lastY);
    let target = under && under.closest ? under.closest(dropSelector) : null;
    // dropping a widget on itself is a no-op: don't pretend otherwise
    if (target === source) {
      target = null;
    }
    if (target === activeTarget) {
      return;
    }
    clearTargetHighlight();
    if (target) {
      activeTarget = target;
      activeTargetClass = target.getAttribute('data-drop-active-class');
      if (activeTargetClass) {
        target.classList.add(activeTargetClass);
      }
    }
  };

  const autoScrollTick = () => {
    const viewport =
      scrollContainer === document.scrollingElement || scrollContainer === document.documentElement
        ? { top: 0, bottom: window.innerHeight }
        : scrollContainer.getBoundingClientRect();
    let speed = 0;
    if (lastY < viewport.top + EDGE_SCROLL_ZONE_PX) {
      speed = -Math.ceil(
        ((viewport.top + EDGE_SCROLL_ZONE_PX - lastY) / EDGE_SCROLL_ZONE_PX) * EDGE_SCROLL_MAX_SPEED_PX
      );
    } else if (lastY > viewport.bottom - EDGE_SCROLL_ZONE_PX) {
      speed = Math.ceil(
        ((lastY - (viewport.bottom - EDGE_SCROLL_ZONE_PX)) / EDGE_SCROLL_ZONE_PX) * EDGE_SCROLL_MAX_SPEED_PX
      );
    }
    if (speed !== 0) {
      scrollContainer.scrollTop += speed;
      // content moved under a still pointer: refresh the hit test
      updateTarget();
    }
    rafId = window.requestAnimationFrame(autoScrollTick);
  };

  const begin = () => {
    started = true;
    scrollContainer = findScrollContainer(source || handle);
    document.body.classList.add(BODY_DRAGGING_CLASS);
    if (bodyClass) {
      document.body.classList.add(bodyClass);
    }
    if (source && draggingClass) {
      source.classList.add(draggingClass);
    }
    ghost = document.createElement('div');
    if (ghostClass) {
      ghost.className = ghostClass;
    }
    // stable global hook: the ghost lives on <body>, outside the themed
    // containers, so theme CSS (dark-mode.css) needs a plain class to target
    ghost.classList.add('gladys-drag-ghost');
    // the class carries the looks; these keep the engine safe on its own
    ghost.style.position = 'fixed';
    ghost.style.top = '0';
    ghost.style.left = '0';
    ghost.style.zIndex = '1060';
    ghost.style.pointerEvents = 'none';
    if (ghostIconClass) {
      const icon = document.createElement('i');
      icon.className = ghostIconClass;
      ghost.appendChild(icon);
    }
    ghost.appendChild(document.createTextNode(ghostLabel || ''));
    document.body.appendChild(ghost);
    positionGhost();
    rafId = window.requestAnimationFrame(autoScrollTick);
  };

  // a click fired by the pointerup that ended a real drag must not reach the
  // app (the sidebar items navigate on click); a click without a drag must
  const suppressNextClick = () => {
    const suppress = clickEvent => {
      clickEvent.preventDefault();
      clickEvent.stopPropagation();
      removeSuppress();
    };
    const removeSuppress = () => {
      window.removeEventListener('click', suppress, true);
    };
    window.addEventListener('click', suppress, true);
    window.setTimeout(removeSuppress, 300);
  };

  const cleanup = () => {
    window.removeEventListener('pointermove', onPointerMove, true);
    window.removeEventListener('pointerup', onPointerUp, true);
    window.removeEventListener('pointercancel', onPointerCancel, true);
    window.removeEventListener('keydown', onKeyDown, true);
    window.removeEventListener('blur', onWindowBlur);
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
    }
    clearTargetHighlight();
    if (ghost && ghost.parentNode) {
      ghost.parentNode.removeChild(ghost);
    }
    if (source && draggingClass) {
      source.classList.remove(draggingClass);
    }
    document.body.classList.remove(BODY_DRAGGING_CLASS);
    if (bodyClass) {
      document.body.classList.remove(bodyClass);
    }
    try {
      handle.releasePointerCapture(pointerId);
    } catch (e) {} // eslint-disable-line no-empty
    dragInProgress = false;
  };

  const onPointerMove = moveEvent => {
    if (moveEvent.pointerId !== pointerId) {
      return;
    }
    lastX = moveEvent.clientX;
    lastY = moveEvent.clientY;
    if (!started) {
      if (Math.abs(lastX - startX) < DRAG_START_THRESHOLD_PX && Math.abs(lastY - startY) < DRAG_START_THRESHOLD_PX) {
        return;
      }
      begin();
    }
    moveEvent.preventDefault();
    positionGhost();
    updateTarget();
  };

  const onPointerUp = upEvent => {
    if (upEvent.pointerId !== pointerId) {
      return;
    }
    if (started) {
      upEvent.preventDefault();
      suppressNextClick();
      if (activeTarget) {
        onDrop(activeTarget);
      }
    }
    cleanup();
  };

  const onPointerCancel = cancelEvent => {
    if (cancelEvent.pointerId !== pointerId) {
      return;
    }
    cleanup();
  };

  const onKeyDown = keyEvent => {
    if (keyEvent.key === 'Escape') {
      cleanup();
    }
  };

  const onWindowBlur = () => {
    cleanup();
  };

  window.addEventListener('pointermove', onPointerMove, true);
  window.addEventListener('pointerup', onPointerUp, true);
  window.addEventListener('pointercancel', onPointerCancel, true);
  window.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('blur', onWindowBlur);
};

export { startPointerDrag };
