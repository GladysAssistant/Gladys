const getApexChartTimelineOptions = ({ displayAxes, height, series, COLORS, locales, defaultLocale }) => {
  const options = {
    series,
    chart: {
      height: 350,
      type: 'rangeBar'
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
      type: 'datetime'
    },
    legend: {
      position: 'right'
    }
  };
  return options;
};

export { getApexChartTimelineOptions };
