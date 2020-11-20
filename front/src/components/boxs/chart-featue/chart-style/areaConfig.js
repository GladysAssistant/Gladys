const OPTIONS = {
  chart: {
    fontFamily: 'inherit',
    height: 40.0,
    sparkline: {
      enabled: true
    },
    animations: {
      enabled: false
    }
  },
  dataLabels: {
    enabled: false
  },
  fill: {
    opacity: 0.16,
    type: 'solid'
  },
  stroke: {
    width: 2,
    lineCap: 'round',
    curve: 'smooth'
  },
  grid: {
    strokeDashArray: 4
  },
  xaxis: {
    labels: {
      padding: 0
    },
    tooltip: {
      enabled: false
    },
    axisBorder: {
      show: false
    },
    type: 'datetime'
  },
  yaxis: {
    labels: {
      padding: 4
    }
  },
  colors: ['#206bc4'],
  legend: {
    show: false
  }
};

module.exports.OPTIONS = OPTIONS;
