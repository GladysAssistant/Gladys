import style from './style.css';
import cx from 'classnames';
import Swal from 'sweetalert2';
import { prepareAndDownloadXLSX, prepareAndDownloadCSV } from '../../../utils/ExportUtils';

const getApexChartBarOptions = ({
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
      type: 'bar',
      fontFamily: 'inherit',
      height: displayAxes ? 200 : 100,
      parentHeightOffset: 0,
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
            filename: `chart-${new Date()
              .toISOString()
              .replace(/T/, ' ')
              .replace(/\..+/, '')
              .replace(/:/g, '-')}`
          },
          png: {
            filename: `chart-${new Date()
              .toISOString()
              .replace(/T/, ' ')
              .replace(/\..+/, '')
              .replace(/:/g, '-')}`
          }
        }
      },
      sparkline: {
        enabled: !displayAxes
      },
      animations: {
        enabled: false
      },
      stacked: true,
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
    plotOptions: {
      bar: {
        columnWidth: '100%'
      }
    },
    dataLabels: {
      enabled: false
    },
    fill: {
      opacity: 1
    },
    series,
    grid: {
      padding: {
        top: -20,
        right: 0,
        left: -4,
        bottom: -4
      },
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: true
        }
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

export { getApexChartBarOptions };
