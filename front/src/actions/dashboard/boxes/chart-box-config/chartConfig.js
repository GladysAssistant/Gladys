const CHART_TYPE_SELECTOR = {
  LINE: {
    name: 'line-selector',
    apexName: 'line'
  },
  AREA: {
    name: 'area-selector',
    apexName: 'area'
  },
  BAR: {
    name: 'bar-selector',
    apexName: 'bar'
  }
};

const CHART_TYPE = [
  {
    label: 'dashboard.chart.type.name.line',
    value: CHART_TYPE_SELECTOR.LINE.name
  },
  {
    label: 'dashboard.chart.type.name.area',
    value: CHART_TYPE_SELECTOR.AREA.name
  },
  {
    label: 'dashboard.chart.type.name.bar',
    value: CHART_TYPE_SELECTOR.BAR.name
  }
];

const CHART_PERIOD = [
  {
    label: 'dashboard.period.label.last1day',
    value: 'last1day-selector'
  },
  {
    label: 'dashboard.period.label.last1week',
    value: 'last1week-selector'
  },
  {
    label: 'dashboard.period.label.last1month',
    value: 'last1month-selector'
  },
  {
    label: 'dashboard.period.label.last1year',
    value: 'last1year-selector'
  }
];

module.exports.CHART_TYPE = CHART_TYPE;
module.exports.CHART_PERIOD = CHART_PERIOD;
module.exports.CHART_TYPE_SELECTOR = CHART_TYPE_SELECTOR;
