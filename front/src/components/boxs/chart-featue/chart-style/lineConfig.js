const OPTIONS = {
  chart: {
    fontFamily: 'inherit',
    toolbar: {
      show: false
    },
    animations: {
      enabled: false
    }
  },
  xaxis: {
    labels: {
      padding: 0
    },
    tooltip: {
      enabled: false
    }
  },
  yaxis: {
    labels: {
      padding: 4
    }
  },
  fill: {
    opacity: 1
  },
  stroke: {
    width: 2,
    lineCap: 'round',
    curve: 'smooth'
  },
  grid: {
    padding: {
      top: -20,
      right: 0,
      left: -4,
      bottom: -4
    },
    strokeDashArray: 4
  },
  colors: ['#206bc4'],
  legend: {
    show: false
  }
};

module.exports.OPTIONS = OPTIONS;
