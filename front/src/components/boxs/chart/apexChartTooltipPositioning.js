// Distance kept between the cursor and the tooltip so the hovered part
// of the curve stays visible
const TOOLTIP_GAP = 30;

// On touch devices the coordinates are on the Touch object, not on the event
const getEventPoint = event => (event.touches && event.touches.length > 0 ? event.touches[0] : event);

const positionTooltipAwayFromCursor = (chartEl, tooltip, clientX, clientY) => {
  // The tooltip is absolutely positioned relative to its offsetParent
  // (the ApexCharts inner wrapper), not relative to the chart container
  const offsetParent = tooltip.offsetParent;
  if (!offsetParent) {
    return;
  }
  const parentRect = offsetParent.getBoundingClientRect();
  const chartRect = chartEl.getBoundingClientRect();
  const tooltipWidth = tooltip.offsetWidth;
  const tooltipHeight = tooltip.offsetHeight;

  // Prefer the bottom-right of the cursor, flip to the other side near the edges
  let viewportLeft = clientX + TOOLTIP_GAP;
  if (viewportLeft + tooltipWidth > chartRect.right) {
    viewportLeft = clientX - TOOLTIP_GAP - tooltipWidth;
  }
  if (viewportLeft < chartRect.left) {
    viewportLeft = chartRect.left;
  }

  let viewportTop = clientY + TOOLTIP_GAP;
  if (viewportTop + tooltipHeight > chartRect.bottom) {
    viewportTop = clientY - TOOLTIP_GAP - tooltipHeight;
  }

  const left = `${Math.round(viewportLeft - parentRect.left)}px`;
  const top = `${Math.round(viewportTop - parentRect.top)}px`;
  // Not writing an unchanged position also stops the mutation observer loop:
  // reacting to our own write recomputes the same values and returns here
  if (tooltip.style.left === left && tooltip.style.top === top) {
    return;
  }
  tooltip.style.left = left;
  tooltip.style.top = top;
};

// ApexCharts repositions its tooltip from several code paths: synchronously in
// its mousemove/touchmove listeners, but also from a ~100ms throttle timer
// (seriesHoverTimeout) that fires after the cursor stopped moving. Positioning
// from chart.events.mouseMove alone therefore always ends up overridden. Instead,
// a MutationObserver watches the tooltip element: whenever ApexCharts moves it,
// the observer immediately (as a microtask, before the frame is painted) moves it
// back to a comfortable distance from the last known cursor position.
const addTooltipPositioning = options => {
  let observer;
  let observedTooltip;
  let lastClientX;
  let lastClientY;

  const repositionIfActive = (chartEl, tooltip) => {
    if (lastClientX === undefined || !tooltip.classList.contains('apexcharts-active')) {
      return;
    }
    positionTooltipAwayFromCursor(chartEl, tooltip, lastClientX, lastClientY);
  };

  const observeTooltip = chartEl => {
    const tooltip = chartEl.querySelector('.apexcharts-tooltip');
    if (!tooltip || tooltip === observedTooltip) {
      return tooltip;
    }
    // The tooltip element is recreated when the chart is re-rendered
    if (observer) {
      observer.disconnect();
    }
    observer = new MutationObserver(() => repositionIfActive(chartEl, tooltip));
    observer.observe(tooltip, { attributes: true, attributeFilter: ['style', 'class'] });
    observedTooltip = tooltip;
    return tooltip;
  };

  if (!options.chart) {
    options.chart = {};
  }
  const existingEvents = options.chart.events || {};
  options.chart.events = {
    ...existingEvents,
    mouseMove(event, chartContext, config) {
      if (typeof existingEvents.mouseMove === 'function') {
        existingEvents.mouseMove(event, chartContext, config);
      }
      const chartEl = chartContext.el;
      if (!chartEl) {
        return;
      }
      const point = getEventPoint(event);
      lastClientX = point.clientX;
      lastClientY = point.clientY;
      const tooltip = observeTooltip(chartEl);
      if (tooltip) {
        repositionIfActive(chartEl, tooltip);
      }
    }
  };
};

export { addTooltipPositioning };
