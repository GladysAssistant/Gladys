// Scroll the page so that an element of the dashboard editor canvas is
// visible ABOVE the edit panel, when that panel is the mobile bottom sheet
// (below the 992px desktop breakpoint). On desktop the panel is a side
// panel and nothing moves.
//
// The editor shows the real dashboard so that every setting is previewed
// live, which is pointless if the sheet covers the widget being edited.
// align 'start' brings the element's top under the app top bar (a whole
// widget, taller than the room left above the sheet, shows its top);
// 'center' centers it in the visible band (one row of a widget).

const MOBILE_SHEET_QUERY = '(max-width: 991.98px)';
// the mobile app top bar (Layout, body.gladys-sidebar-nav) is 3.25rem tall
const TOP_BAR_REM = 3.25;
const MARGIN_PX = 12;

const revealAbovePanel = (element, panelElement, align = 'start') => {
  if (!element || !panelElement || !window.matchMedia || !window.matchMedia(MOBILE_SHEET_QUERY).matches) {
    return;
  }
  const rootFontSize = parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16;
  const visibleTop = TOP_BAR_REM * rootFontSize + MARGIN_PX;
  const visibleBottom = panelElement.getBoundingClientRect().top - MARGIN_PX;
  const rect = element.getBoundingClientRect();
  if (rect.top >= visibleTop && rect.bottom <= visibleBottom) {
    return;
  }
  let delta = rect.top - visibleTop;
  if (align === 'center') {
    delta = rect.top - (visibleTop + (visibleBottom - visibleTop) / 2 - rect.height / 2);
  }
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollBy({ top: delta, behavior: reduceMotion ? 'auto' : 'smooth' });
};

export { revealAbovePanel };
