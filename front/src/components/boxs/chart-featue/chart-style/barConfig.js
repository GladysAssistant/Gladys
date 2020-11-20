const OPTIONS = {
  chart: {
    fontFamily: 'inherit',
    sparkline: {
      enabled: true
    },
    animations: {
      enabled: false
    }
  },
  plotOptions: {
    bar: {
      columnWidth: '50%'
    }
  },
  dataLabels: {
    enabled: false
  },
  fill: {
    opacity: 1
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
