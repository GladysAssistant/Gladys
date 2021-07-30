import { Component, createRef } from 'preact';
import ApexCharts from 'apexcharts';

class ApexChartComponent extends Component {
  chartRef = createRef();
  getAreaChartOptions = () => {
    const options = {
      chart: {
        type: 'area',
        fontFamily: 'inherit',
        height: this.props.height,
        sparkline: {
          enabled: true
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
        strokeDashArray: 4
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
  displayChart = () => {
    const options = this.getAreaChartOptions();
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
    if (labelsDifferent || seriesDifferent) {
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
