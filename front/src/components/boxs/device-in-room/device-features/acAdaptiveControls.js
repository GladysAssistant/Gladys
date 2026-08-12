/**
 * Per-card coordinator that lets several option controls sharing the same device table decide,
 * together, whether to render as an inline button group or as a compact dropdown.
 *
 * All controls of a card share the same table column, so the decision cannot be taken in
 * isolation. Each card starts with every control rendered as buttons; while the table overflows
 * its bounded scroll area, the widest control still showing buttons is switched to a dropdown,
 * until everything fits. This yields "buttons when they fit on a single line, dropdown otherwise"
 * for a variable number of options, on every screen size, using the real layout (no guesswork).
 */

const cards = new Map(); // cardElement -> { controls: Set, observer: ResizeObserver|null, raf: number }

const canObserveResize = typeof ResizeObserver === 'function';
const canAnimationFrame = typeof requestAnimationFrame === 'function';

function reflow(cardElement) {
  const entry = cards.get(cardElement);
  if (!entry) {
    return;
  }
  const box = cardElement.querySelector('.table-responsive');
  if (!box || box.clientWidth === 0) {
    return;
  }
  const controls = [...entry.controls];
  // Start from the most expanded state, then collapse the widest ones until it fits.
  controls.forEach(control => control.show('buttons'));
  let guard = 0;
  while (box.scrollWidth > box.clientWidth + 1 && guard < 30) {
    guard += 1;
    const stillButtons = controls.filter(control => control.mode === 'buttons');
    if (stillButtons.length === 0) {
      break;
    }
    const widest = stillButtons.reduce((a, b) => (b.requiredWidth() > a.requiredWidth() ? b : a));
    widest.show('dropdown');
  }
}

function scheduleReflow(cardElement) {
  const entry = cards.get(cardElement);
  if (!entry) {
    return;
  }
  if (canAnimationFrame) {
    cancelAnimationFrame(entry.raf);
    entry.raf = requestAnimationFrame(() => reflow(cardElement));
  } else {
    reflow(cardElement);
  }
}

/**
 * @description Register an adaptive control against the card that owns it.
 * @param {Element} cardElement - The `.card` element the control belongs to.
 * @param {object} control - The control handle ({ mode, show(mode), requiredWidth() }).
 * @returns {Function} A function that unregisters the control (call it on unmount).
 * @example
 * const off = registerAdaptiveControl(card, control);
 */
function registerAdaptiveControl(cardElement, control) {
  if (!cardElement) {
    return () => {};
  }
  let entry = cards.get(cardElement);
  if (!entry) {
    entry = { controls: new Set(), observer: null, raf: 0 };
    if (canObserveResize) {
      entry.observer = new ResizeObserver(() => scheduleReflow(cardElement));
      entry.observer.observe(cardElement.querySelector('.table-responsive') || cardElement);
    }
    cards.set(cardElement, entry);
  }
  entry.controls.add(control);
  scheduleReflow(cardElement);

  return function unregister() {
    const current = cards.get(cardElement);
    if (!current) {
      return;
    }
    current.controls.delete(control);
    if (current.controls.size === 0) {
      if (current.observer) {
        current.observer.disconnect();
      }
      if (canAnimationFrame) {
        cancelAnimationFrame(current.raf);
      }
      cards.delete(cardElement);
    } else {
      scheduleReflow(cardElement);
    }
  };
}

export { registerAdaptiveControl, scheduleReflow };
