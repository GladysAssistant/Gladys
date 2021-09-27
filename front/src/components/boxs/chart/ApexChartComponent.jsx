import { Component, createRef } from 'preact';
import ApexCharts from 'apexcharts';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

class ApexChartComponent extends Component {
  chartRef = createRef();
  getBarChartOptions = () => {
    const options = {
      chart: {
        type: 'bar',
        fontFamily: 'inherit',
        height: this.props.display_axes ? 200 : 100,
        parentHeightOffset: 0,
        toolbar: {
          show: false
        },
        sparkline: {
          enabled: !this.props.display_axes
        },
        animations: {
          enabled: false
        },
        stacked: true
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
      series: this.props.series,
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
          padding: 0
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
      labels: this.props.labels,
      colors: ['#206bc4'],
      legend: {
        show: false
      }
    };
    return options;
  };
  getAreaChartOptions = () => {
    let height;
    if (this.props.size === 'small' && !this.props.display_axes) {
      height = 40;
    } else if (this.props.size === 'big' && !this.props.display_axes) {
      height = 80;
    } else {
      height = 200;
    }
    const options = {
      chart: {
        type: 'area',
        fontFamily: 'inherit',
        height,
        parentHeightOffset: 0,
        sparkline: {
          enabled: !this.props.display_axes
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
        opacity: 0.16,
        type: 'solid'
      },
      stroke: {
        width: 2,
        lineCap: 'round',
        curve: 'smooth'
      },
      series: this.props.series,
      grid: {
        strokeDashArray: 4,
        padding: {
          left: -4
        }
      },
      xaxis: {
        labels: {
          padding: 0
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
      labels: this.props.labels,
      colors: ['#206bc4'],
      legend: {
        show: false
      }
    };
    if (this.props.interval === 60 || this.props.interval === 24 * 60) {
      const formatter = value => {
        return dayjs(value)
          .locale(this.props.user.language)
          .fromNow();
      };
      options.tooltip = {
        x: {
          formatter
        }
      };
    }
    return options;
  };
  getLineChartOptions = () => {
    let height;
    if (this.props.size === 'small' && !this.props.display_axes) {
      height = 40;
    } else if (this.props.size === 'big' && !this.props.display_axes) {
      height = 80;
    } else {
      height = 200;
    }
    const options = {
      chart: {
        type: 'line',
        fontFamily: 'inherit',
        height,
        parentHeightOffset: 0,
        sparkline: {
          enabled: !this.props.display_axes
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
        width: [2, 1],
        dashArray: [0, 3],
        lineCap: 'round',
        curve: 'smooth'
      },
      series: this.props.series,
      grid: {
        strokeDashArray: 4,
        padding: {
          left: -4
        }
      },
      xaxis: {
        labels: {
          padding: 0
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
      labels: this.props.labels,
      colors: ['#206bc4'],
      legend: {
        show: false
      }
    };
    if (this.props.interval === 60 || this.props.interval === 24 * 60) {
      const formatter = value => {
        return dayjs(value)
          .locale(this.props.user.language)
          .fromNow();
      };
      options.tooltip = {
        x: {
          formatter
        }
      };
    }
    return options;
  };
  displayChart = () => {
    let options;
    if (this.props.chart_type === 'area') {
      options = this.getAreaChartOptions();
    } else if (this.props.chart_type === 'line') {
      options = this.getLineChartOptions();
    } else if (this.props.chart_type === 'bar') {
      options = this.getBarChartOptions();
    } else {
      options = this.getAreaChartOptions();
    }
    if (this.chart) {
      this.chart.updateOptions(options);
    } else {
      this.chart = new ApexCharts(this.chartRef.current, options);
      this.chart.render();
    }
  };
  componentDidMount() {
    this.displayChart();
  }
  componentDidUpdate(nextProps) {
    const labelsDifferent = nextProps.labels !== this.props.labels;
    const seriesDifferent = nextProps.series !== this.props.series;
    const chartTypeDifferent = nextProps.chart_type !== this.props.chart_type;
    const displayAxesDifferent = nextProps.display_axes !== this.props.display_axes;
    const intervalDifferent = nextProps.interval !== this.props.interval;
    const sizeDifferent = nextProps.size !== this.props.size;
    if (
      labelsDifferent ||
      seriesDifferent ||
      chartTypeDifferent ||
      displayAxesDifferent ||
      intervalDifferent ||
      sizeDifferent
    ) {
      this.displayChart();
    }
  }
  componentWillUnmount() {
    if (this.chart && typeof this.chart.destroy === 'function') {
      this.chart.destroy();
    }
  }
  render() {
    return <div ref={this.chartRef} class="chart-sm" />;
  }
}

export default ApexChartComponent;
