import style from './style.css';
import cx from 'classnames';
import Swal from 'sweetalert2';
import { prepareAndDownloadXLSX, prepareAndDownloadCSV } from '../../../utils/ExportUtils';

const getApexChartStepLineOptions = ({
  height,
  displayAxes,
  series,
  colors,
  locales,
  defaultLocale,
  activeToolbar = false,
  dictionary = null,
  chartType = null,
  eventZoomed = null
}) => {
  const chartDictionary = dictionary ? dictionary.dashboard.boxes.chart : {};
  const fileName = dictionary ? `chart-${chartDictionary[chartType].toLowerCase()}` : null;
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
        show: activeToolbar,
        tools: activeToolbar
          ? {
              selection: true,
              zoom: true,
              zoomin: true,
              zoomout: true,
              pan: true,
              reset: true,
              download: true,
              customIcons: [
                {
                  icon: '<i class="fe fe-download" />',
                  index: 0,
                  title: chartDictionary.downloadDescription,
                  class: cx(style.customCsvDownload),
                  click: function(chart) {
                    Swal.fire({
                      title: chartDictionary.downloadOptionsDescription,
                      input: 'select',
                      inputOptions: {
                        csv: `CSV: ${fileName}.csv`,
                        xlsx: `XLSX: ${fileName}.xlsx`
                      },
                      inputPlaceholder: 'Sélectionnez un format',
                      showCancelButton: true,
                      customClass: {
                        popup: cx(style.swal2Popup),
                        confirmButton: cx(style.swal2Styled, style.swal2Confirm),
                        cancelButton: cx(style.swal2Styled, style.swal2Cancel),
                        title: cx(style.swal2Title),
                        select: cx(style.swal2Select)
                      }
                    }).then(result => {
                      if (result.isConfirmed) {
                        const exportType = result.value;
                        if (exportType === 'csv') {
                          prepareAndDownloadCSV(chart, fileName);
                        } else if (exportType === 'xlsx') {
                          prepareAndDownloadXLSX(chart, fileName);
                        } else {
                          Swal.fire(chartDictionary.downloadFormatOptionsError);
                        }
                      }
                    });
                  }
                }
              ]
            }
          : {},
        export: {
          svg: {
            filename: `${fileName}-${new Date()
              .toISOString()
              .replace(/T/, ' ')
              .replace(/\..+/, '')
              .replace(/:/g, '-')}`
          },
          png: {
            filename: `${fileName}-${new Date()
              .toISOString()
              .replace(/T/, ' ')
              .replace(/\..+/, '')
              .replace(/:/g, '-')}`
          }
        }
      },
      animations: {
        enabled: false
      },
      events: {
        zoomed: function(chartContext, { xaxis }) {
          const { min, max } = xaxis;
          if (min !== undefined && max !== undefined) {
            eventZoomed(min, max);
          } else {
            eventZoomed(null, null);
          }
        }
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
      curve: 'stepline'
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
    colors,
    legend: {
      show: displayAxes,
      position: 'bottom'
    }
  };
  return options;
};

export { getApexChartStepLineOptions };
