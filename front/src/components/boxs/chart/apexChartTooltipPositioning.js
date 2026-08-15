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

  // Prefer the bottom-right of the cursor, flip to the other side near the
  // edges. The top is intentionally not clamped to the chart: small sparkline
  // boxes are only 40-80px high and the tooltip must overflow above them,
  // never fall back onto the cursor
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
// its mousemove/touchmove listeners, from a ~100ms throttle timer
// (seriesHoverTimeout) that fires after the cursor stopped moving, and after
// every re-render (live boxes rebuild their series on each new device state,
// which recreates the tooltip element). Positioning from chart.events.mouseMove
// alone therefore always ends up overridden. Instead, a MutationObserver
// watches the current tooltip element: whenever ApexCharts moves it, the
// observer immediately (as a microtask, before the frame is painted) moves it
// back to a comfortable distance from the last known cursor position.
//
// The returned instance must outlive chart re-renders so the cursor position
// and the observer survive live data refreshes: create it once per chart
// component, call addToOptions() on every (re)build of the chart options, and
// dispose() when the chart is destroyed.
const createTooltipPositioning = () => {
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

  // Attach the observer to the current tooltip element and re-apply the
  // position: called on mount, after every re-render and on every mouse move
  const refresh = chartContext => {
    const chartEl = chartContext && chartContext.el;
    if (!chartEl) {
      return;
    }
    const tooltip = observeTooltip(chartEl);
    if (tooltip) {
      repositionIfActive(chartEl, tooltip);
    }
  };

  const addToOptions = options => {
    if (!options.chart) {
      options.chart = {};
    }
    const existingEvents = options.chart.events || {};
    options.chart.events = {
      ...existingEvents,
      mounted(chartContext, config) {
        if (typeof existingEvents.mounted === 'function') {
          existingEvents.mounted(chartContext, config);
        }
        refresh(chartContext);
      },
      updated(chartContext, config) {
        if (typeof existingEvents.updated === 'function') {
          existingEvents.updated(chartContext, config);
        }
        refresh(chartContext);
      },
      mouseMove(event, chartContext, config) {
        if (typeof existingEvents.mouseMove === 'function') {
          existingEvents.mouseMove(event, chartContext, config);
        }
        const point = getEventPoint(event);
        lastClientX = point.clientX;
        lastClientY = point.clientY;
        refresh(chartContext);
      }
    };
  };

  const dispose = () => {
    if (observer) {
      observer.disconnect();
    }
    observer = undefined;
    observedTooltip = undefined;
    lastClientX = undefined;
    lastClientY = undefined;
  };

  return { addToOptions, dispose };
};

export { createTooltipPositioning };
