const getApexChartLineOptions = ({ height, displayAxes, series, colors, locales, defaultLocale }) => {
  const options = {
    chart: {
      locales,
      defaultLocale,
      type: 'line',
      fontFamily: 'inherit',
      height,
      parentHeightOffset: 0,
      sparkline: {
        enabled: !displayAxes
      },
      toolbar: {
        show: false
      },
      animations: {
        enabled: false
      }
    },
    dataLabels: {
      enabled: false
    },
    fill: {
      opacity: 1
    },
    stroke: {
      width: 2,
      lineCap: 'round',
      curve: 'smooth'
    },
    series,
    grid: {
      strokeDashArray: 4,
      padding: {
        left: -4
      }
    },
    xaxis: {
      labels: {
        padding: 0,
        datetimeUTC: false
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
        padding: 4,
        formatter: function(value) {
          if (Math.abs(value) < 1) {
            return value; // For very low values, like crypto prices, use the normal value
          } else {
            return value.toFixed(2); // 2 decimal places for other values
          }
        }
      }
    },
    colors,
    legend: {
      show: displayAxes,
      position: 'bottom'
    }
  };
  return options;
};

export { getApexChartLineOptions };
