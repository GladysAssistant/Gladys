const getApexChartTimelineOptions = ({ displayAxes, height, series, colors, locales, defaultLocale }) => {
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
        enabled: true
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
        barHeight: '40%',
        rangeBarGroupRows: true
      }
    },
    colors,
    fill: {
      type: 'solid'
    },
    xaxis: {
      labels: {
        padding: 0,
        datetimeUTC: false
      },
      axisBorder: {
        show: false
      },
      type: 'datetime'
    },
    yaxis: {
      axisBorder: {
        show: true
      },
      labels: {
        // formatter: function (value) {
        //     return value.split('-').join('<br/>');
        // }
      }
    },
    legend: {
      show: displayAxes,
      position: 'bottom',
      itemMargin: {
        horizontal: 20
      }
    },
    tooltip: {
      // theme: 'dark',
      marker: {
        show: true
      },
      onDatasetHover: {
        highlightDataSeries: true
      },
      items: {
        display: 'flex'
      },
      fillSeriesColor: false,
      fixed: {
        enabled: false
      }
    }
  };
  return options;
};

export { getApexChartTimelineOptions };
