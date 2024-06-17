const addYAxisStyles = () => {
  const yAxisLabel = document.querySelectorAll('.apexcharts-yaxis-label');
  let fontSize = '12px';
  yAxisLabel.forEach(text => {
    const title = text.querySelector('title');
    if (title) {
      const textContent = title.textContent;
      let lines = textContent.split('\n');
      text.innerHTML = '';
      lines.forEach((line, index) => {
        const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        if (line.length > 10) {
          line = `${line.substring(0, 10)}...`;
        }
        tspan.setAttribute('x', text.getAttribute('x'));
        tspan.setAttribute('dy', index === 0 ? '-0.4em' : '1.2em');
        tspan.setAttribute('font-size', fontSize);
        tspan.textContent = line;
        text.appendChild(tspan);
      });
      const newTitle = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      newTitle.textContent = textContent;
      text.appendChild(newTitle);
    }
  });
};

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
      },
      events: {
        mounted: addYAxisStyles,
        updated: addYAxisStyles
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
      type: 'datetime',
      min: Math.min(...series.flatMap(s => s.data.map(d => d.y[0]))),
      max: Math.max(...series.flatMap(s => s.data.map(d => d.y[1])))
    },
    yaxis: {
      showAlways: false,
      dataLabels: {
        enabled: false,
        textAnchor: 'start'
      },
      axisBorder: {
        show: true
      },
      labels: {
        align: 'left',
        maxWidth: 80,
        margin: 0,
        formatter: function (value) {
          if (value.length > 10) {
            const deviceName = value.split(' (')[0];
            const featureName = value.split(' (')[1].replace(')', '');
            const newValue = `${deviceName}\n(${featureName})`;
            return newValue;
          }
          return value;
        },
        offsetX: -20,
        offsetY: 0
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
        enabled: true,
        position: 'topLeft',
        offsetX: 0,
        offsetY: -70
      }
    }
  };
  return options;
};

export { getApexChartTimelineOptions };
