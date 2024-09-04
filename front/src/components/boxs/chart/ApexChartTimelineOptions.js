const addYAxisStyles = () => {
  const yAxisLabel = document.querySelectorAll('.apexcharts-yaxis-label');
  let fontSize = '12px';
  yAxisLabel.forEach(text => {
    const title = text.querySelector('title');
    if (title) {
      const textContent = title.textContent;
      let lines = textContent.split('\n');
      let countLineBreak = (textContent.match(/\n/g) || []).length;
      let marginDy;
      if (countLineBreak === 2) {
        marginDy = '-1.0em';
      } else if (countLineBreak === 1) {
        marginDy = '-0.4em';
      } else if (countLineBreak === 0) {
        marginDy = '0em';
      }
      text.innerHTML = '';
      lines.forEach((line, index) => {
        const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan.setAttribute('x', text.getAttribute('x'));
        tspan.setAttribute('dy', index === 0 ? marginDy : '1.2em');
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
        minWidth: 50,
        maxWidth: 100,
        margin: 5,
        formatter: function(value) {
          const nbLines = 3;
          if (value.length > 15) {
            let [deviceName, featureName] = value.split(' (');
            if (featureName) {
              featureName = featureName.replace(')', '');
            }

            let result = [];
            let currentLine = '';

            for (let i = 0; i < deviceName.length; i++) {
              currentLine += deviceName[i].replace('-', ' ').replace('_', ' ');
              if (currentLine.length >= 15) {
                let lastSpaceIndex = currentLine.lastIndexOf(' ');
                if (lastSpaceIndex > -1) {
                  result.push(currentLine.slice(0, lastSpaceIndex).trim());
                  currentLine = currentLine.slice(lastSpaceIndex + 1);
                } else {
                  result.push(currentLine.trim());
                  currentLine = '';
                }
              }
            }

            if (currentLine.length > 0) {
              result.push(currentLine.trim());
            }
            if (result.length > nbLines && !featureName) {
              result = result.slice(0, nbLines);
              result[nbLines - 1] += '...';
            }
            if (result.length > nbLines - 1 && featureName) {
              result = result.slice(0, nbLines - 1);
              result[nbLines - 2] += '...';
            }
            deviceName = result.join('\n');

            if (featureName) {
              return `${deviceName}\n(${featureName})`;
            }

            return deviceName;
          }

          return value;
        },
        offsetX: -10,
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
      //theme: 'dark',
      marker: {
        show: true
      },
      onDatasetHover: {
        highlightDataSeries: false
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
