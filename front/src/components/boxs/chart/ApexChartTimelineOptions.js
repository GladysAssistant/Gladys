import style from './style.css';
import cx from 'classnames';
import Swal from 'sweetalert2';
import { prepareAndDownloadXLSX, prepareAndDownloadCSV } from '../../../utils/ExportUtils';

const getApexChartTimelineOptions = ({
    displayAxes,
    height,
    series,
    DEFAULT_COLORS,
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
                show: activeToolbar,
                tools: activeToolbar
                    ? {
                        customIcons: [
                            {
                                icon: '<i class="fe fe-download" />',
                                index: 0,
                                title: chartDictionary.downloadDescription,
                                class: cx(style.customCsvDownload),
                                click: function (chart) {
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
                    },
                }
            },
            animations: {
                enabled: true
            },
            events: {
                zoomed: eventZoomed && function (chartContext, { xaxis }) {
                    const { min, max } = xaxis;
                    if (min !== undefined && max !== undefined) {
                        eventZoomed(min, max);
                    } else {
                        eventZoomed(null, null);
                    }
                }
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
        colors: DEFAULT_COLORS,
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
        },
        legend: {
            show: displayAxes,
            position: 'bottom',
            itemMargin: {
                horizontal: 20
            },
        },
        tooltip: {
            // theme: 'dark',
            marker: {
                show: true
            },
            onDatasetHover: {
                highlightDataSeries: true,
            },
            items: {
                display: 'flex',
            },
            fillSeriesColor: false,
            fixed: {
                enabled: false,
            }
        }
    };
    return options;
};

export { getApexChartTimelineOptions };
