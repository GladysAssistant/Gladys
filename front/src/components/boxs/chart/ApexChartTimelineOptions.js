const getApexChartTimelineOptions = ({ displayAxes, height, series, COLORS, locales, defaultLocale }) => {
  const options = {
    series,
    chart: {
      locales,
      defaultLocale,
      type: 'rangeBar',
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
    grid: {
      strokeDashArray: 4,
      padding: {
        left: 1
      }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '50%',
        rangeBarGroupRows: true
      }
    },
    colors: COLORS,
    fill: {
      type: 'solid'
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
    legend: {
      show: displayAxes,
      position: 'bottom'
    }
  };
  return options;
};

export { getApexChartTimelineOptions };
