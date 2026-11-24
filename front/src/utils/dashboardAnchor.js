// The widget the user was looking at when going from a dashboard to its editor (or back), so the
// other side opens on that widget instead of on a raw scroll position: the editor is taller than
// the dashboard (edit chrome), the same scrollY lands on another widget
// (docs/specs/dashboard-flexible-layout-and-widgets.md, A.3 "Entering and leaving the editor").
// It can also carry what the editor should do on arrival (the long-press menu of the dashboard
// opens the editor on a widget already selected, or with its "Move to…" open).

// An anchor older than this was not followed by the navigation it was taken for
const ANCHOR_TTL_MS = 10000;
// The app top bar on a phone: a widget hidden under it is not "the one being looked at"
const TOP_INSET_PX = 64;
// How long the page is kept on the widget while the widgets load their data and grow
const HOLD_MS = 2500;
const USER_SCROLL_EVENTS = ['wheel', 'touchstart', 'keydown', 'pointerdown'];

let pendingAnchor = null;

/**
 * @description Remembers the widget to open the next dashboard page on.
 * @param {object} anchor - { selector, target, x, y, offset, intent } or null to forget. target is
 * the page it is for, 'editor' or 'viewer': the page leaving must not take its own anchor.
 * @example setDashboardAnchor({ selector: 'home', target: 'editor', x: 1, y: 0, offset: 120 });
 */
const setDashboardAnchor = anchor => {
  pendingAnchor = anchor ? { ...anchor, at: Date.now() } : null;
};

/**
 * @description Takes (once) the anchor left for this dashboard and this page, if it is recent.
 * @param {string} selector - The dashboard selector.
 * @param {string} target - The page taking it: 'editor' or 'viewer'.
 * @returns {object} The anchor, or null.
 * @example takeDashboardAnchor('home', 'editor');
 */
const takeDashboardAnchor = (selector, target) => {
  const anchor = pendingAnchor;
  if (!anchor || anchor.selector !== selector || anchor.target !== target || Date.now() - anchor.at > ANCHOR_TTL_MS) {
    return null;
  }
  pendingAnchor = null;
  return anchor;
};

/**
 * @description Finds the first widget visible below the top bar.
 * @param {Array} entries - The widgets, in page order: { element, x, y }.
 * @returns {object} { x, y, offset } of the widget, offset being its top in the viewport, or null.
 * @example findVisibleWidget([{ element, x: 0, y: 0 }]);
 */
const findVisibleWidget = entries => {
  for (let i = 0; i < entries.length; i += 1) {
    const { element, x, y } = entries[i];
    const rect = element ? element.getBoundingClientRect() : null;
    if (rect && rect.height > 0 && rect.bottom > TOP_INSET_PX + 24) {
      return { x, y, offset: Math.round(rect.top) };
    }
  }
  return null;
};

/**
 * @description Scrolls the page so an element stands at a given distance from the top of the
 * viewport, and keeps it there while the page settles (the widgets load their data and change
 * height), until the user scrolls or the delay runs out.
 * @param {Function} findElement - Returns the element (it can be re-rendered meanwhile).
 * @param {number} offset - Where its top must stand, in viewport pixels.
 * @returns {Function} Stops holding.
 * @example holdElementAt(() => document.querySelector('#a'), 120);
 */
const holdElementAt = (findElement, offset) => {
  let stopped = false;
  let observer = null;
  let timer = null;
  const stop = () => {
    if (stopped) {
      return;
    }
    stopped = true;
    USER_SCROLL_EVENTS.forEach(type => window.removeEventListener(type, stop, true));
    if (observer) {
      observer.disconnect();
    }
    clearTimeout(timer);
  };
  const align = () => {
    if (stopped) {
      return;
    }
    const element = findElement();
    if (!element) {
      return;
    }
    const delta = element.getBoundingClientRect().top - Math.max(TOP_INSET_PX, offset);
    if (Math.abs(delta) > 1) {
      window.scrollBy(0, delta);
    }
  };
  USER_SCROLL_EVENTS.forEach(type => window.addEventListener(type, stop, { capture: true, passive: true }));
  // eslint-disable-next-line compat/compat
  if (typeof window.ResizeObserver === 'function') {
    // eslint-disable-next-line compat/compat
    observer = new window.ResizeObserver(align);
    observer.observe(document.body);
  }
  align();
  requestAnimationFrame(align);
  timer = setTimeout(stop, HOLD_MS);
  return stop;
};

export { setDashboardAnchor, takeDashboardAnchor, findVisibleWidget, holdElementAt };
