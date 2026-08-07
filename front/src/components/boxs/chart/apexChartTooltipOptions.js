const TOOLTIP_OFFSET_X = 15;
const TOOLTIP_OFFSET_Y = 20;

const positionTooltipBelowCursor = (event, chartContext) => {
  const tooltip = chartContext.el.querySelector('.apexcharts-tooltip.apexcharts-active');
  if (!tooltip) {
    return;
  }

  const chartRect = chartContext.el.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();

  let left = event.clientX - chartRect.left + TOOLTIP_OFFSET_X;
  let top = event.clientY - chartRect.top + TOOLTIP_OFFSET_Y;

  if (left + tooltipRect.width > chartRect.width - 10) {
    left = event.clientX - chartRect.left - tooltipRect.width - TOOLTIP_OFFSET_X;
  }

  if (top + tooltipRect.height > chartRect.height - 10) {
    top = event.clientY - chartRect.top - tooltipRect.height - TOOLTIP_OFFSET_Y;
  }

  if (left < 0) {
    left = 0;
  }
  if (top < 0) {
    top = 0;
  }

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
};

const getTooltipBelowCursorEvents = existingEvents => ({
  ...existingEvents,
  mouseMove(event, chartContext, config) {
    if (existingEvents && existingEvents.mouseMove) {
      existingEvents.mouseMove(event, chartContext, config);
    }
    positionTooltipBelowCursor(event, chartContext);
  }
});

const getApexChartTooltipOptions = ({ xFormatter } = {}) => {
  const tooltip = {
    followCursor: true,
    intersect: false,
    cssClass: 'gladys-chart-tooltip',
    fixed: {
      enabled: false
    }
  };

  if (xFormatter) {
    tooltip.x = { formatter: xFormatter };
  }

  return tooltip;
};

const applyApexChartTooltipOptions = (options, { xFormatter } = {}) => {
  options.tooltip = {
    ...options.tooltip,
    ...getApexChartTooltipOptions({ xFormatter })
  };

  if (!options.chart) {
    options.chart = {};
  }

  options.chart.events = getTooltipBelowCursorEvents(options.chart.events);
};

export { applyApexChartTooltipOptions, getApexChartTooltipOptions, positionTooltipBelowCursor };
