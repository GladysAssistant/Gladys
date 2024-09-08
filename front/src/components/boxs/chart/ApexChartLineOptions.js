const getApexChartLineOptions = ({ height, displayAxes, series, colors, locales, defaultLocale, seriesPoints, seriesAnnotationsYaxis }) => {
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
    },
    annotations: {
      yaxis: seriesAnnotationsYaxis, 
      // points: seriesPoints,

      // points: [
      //   // {
      //   //   y: 5, // Valeur de la ligne min
      //   //   borderColor: '#FF0000', // Couleur de la ligne
      //   //   label: {
      //   //     borderColor: '#FF0000',
      //   //     style: {
      //   //       color: '#fff',
      //   //       background: '#FF0000'
      //   //     },
      //   //     text: 'Min Value'
      //   //   }
      //   // },
      //   // {
      //   //   y: 20, // Valeur de la ligne max
      //   //   borderColor: '#00FF00', // Couleur de la ligne
      //   //   label: {
      //   //     borderColor: '#00FF00',
      //   //     style: {
      //   //       color: '#fff',
      //   //       background: '#00FF00'
      //   //     },
      //   //     text: 'Max Value'
      //   //   }
      //   // },
      //   // {
      //   //   y: 22,
      //   //   y2: 24,
      //   //   borderColor: '#00E396',
      //   //   label: {
      //   //     text: 'Consigne 8:00'
      //   //   }
      //   // },
      //   // {
      //   //   y: 17,
      //   //   x: 3, // Position sur l'axe X (11:00)
      //   //   borderColor: '#FEB019',
      //   //   label: {
      //   //     text: 'Consigne 11:00'
      //   //   }
      //   // },
      //   {
      //     y: 20,
      //     y2: 24,
      //     x: 1725638947166, // Position sur l'axe X (15:00)
      //     borderColor: '#FF4560',
      //     label: {
      //       text: 'Consigne 15:00'
      //     }
      //   },
      //   {
      //     y: 20,
      //     y2: 24,
      //     x: 1725649979366, // Position sur l'axe X (15:00)
      //     borderColor: '#FF4560',
      //     label: {
      //       text: 'Consigne 15:00'
      //     }
      //   }

      // ]
    }
  };
  return options;
};

export { getApexChartLineOptions };
