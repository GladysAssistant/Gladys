const getApexChartLineOptions = ({ height, displayAxes, series, COLORS, locales, defaultLocale }) => {
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
        padding: 4
      }
    },
    colors: COLORS,
    legend: {
      show: displayAxes,
      position: 'bottom'
    }
  };
  return options;
};

export { getApexChartLineOptions };
