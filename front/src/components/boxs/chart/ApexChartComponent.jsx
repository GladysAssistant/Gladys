import { Component, createRef } from 'preact';
import ApexCharts from 'apexcharts';

import fr from 'apexcharts/dist/locales/fr.json';
import en from 'apexcharts/dist/locales/en.json';
import de from 'apexcharts/dist/locales/de.json';

import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { getApexChartBarOptions } from './ApexChartBarOptions';
import { getApexChartAreaOptions } from './ApexChartAreaOptions';
import { getApexChartLineOptions } from './ApexChartLineOptions';
import { getApexChartStepLineOptions } from './ApexChartStepLineOptions';
import { getApexChartTimelineOptions } from './ApexChartTimelineOptions';
import mergeArray from '../../../utils/mergeArray';

dayjs.extend(localizedFormat);

const DEFAULT_COLORS = [
  '#316cbe',
  '#d63031',
  '#00b894',
  '#fdcb6e',
  '#6c5ce7',
  '#00cec9',
  '#e84393',
  '#e17055',
  '#636e72'
];
const DEFAULT_COLORS_NAME = ['blue', 'red', 'green', 'yellow', 'purple', 'aqua', 'pink', 'orange', 'grey'];

class ApexChartComponent extends Component {
  chartRef = createRef();
  addDateFormatter(options) {
    let formatter;
    const intervalDate = (this.props.endDate - this.props.startDate) / 60000;
    if (this.props.interval <= 24 * 60 || intervalDate <= 7 * 24 * 60) {
      formatter = value => {
        return dayjs(value)
          .locale(this.props.user.language)
          .format('LLL');
      };
    } else {
      formatter = value => {
        return dayjs(value)
          .locale(this.props.user.language)
          .format('LL');
      };
    }
    options.tooltip = {
      x: {
        formatter
      }
    };
  }
  getBarChartOptions = () => {
    const options = getApexChartBarOptions({
      displayAxes: this.props.display_axes,
      series: this.props.series,
      colors: mergeArray(this.props.colors, DEFAULT_COLORS),
      locales: [fr, en, de],
      defaultLocale: this.props.user.language,
      activeToolbar: this.props.detailed_view ? true : null,
      dictionary: this.props.detailed_view ? this.props.dictionary : null,
      chartType: this.props.detailed_view ? this.props.chart_type : null,
      eventZoomed: this.props.detailed_view ? this.handleZoom : null
    });
    this.addDateFormatter(options);
    return options;
  };
  getAreaChartOptions = () => {
    let height;
    const seriesValues = this.props.series.flatMap(serie => serie.data.map(point => point.y));
    const minValue = Math.min(...seriesValues);
    const maxValue = Math.max(...seriesValues);
    const avgValue = seriesValues.reduce((acc, val) => acc + val, 0) / seriesValues.length;
    const valueDifference = maxValue - minValue;

    if (valueDifference < 0.1 * avgValue) {
      height = 100;
    } else if (valueDifference < 0.5 * avgValue) {
      height = 150;
    } else if (valueDifference < avgValue) {
      height = 200;
    } else {
      height = 400;
    }
    const options = getApexChartAreaOptions({
      height,
      series: this.props.series,
      displayAxes: this.props.display_axes,
      colors: mergeArray(this.props.colors, DEFAULT_COLORS),
      locales: [fr, en, de],
      defaultLocale: this.props.user.language,
      activeToolbar: this.props.detailed_view ? true : null,
      dictionary: this.props.detailed_view ? this.props.dictionary : null,
      chartType: this.props.detailed_view ? this.props.chart_type : null,
      eventZoomed: this.props.detailed_view ? this.handleZoom : null
    });
    this.addDateFormatter(options);

    return options;
  };
  getLineChartOptions = () => {
    let height;
    const seriesValues = this.props.series.flatMap(serie => serie.data.map(point => point.y));
    const minValue = Math.min(...seriesValues);
    const maxValue = Math.max(...seriesValues);
    const avgValue = seriesValues.reduce((acc, val) => acc + val, 0) / seriesValues.length;
    const valueDifference = maxValue - minValue;
    if (valueDifference < 0.1 * avgValue) {
      height = 100;
    } else if (valueDifference < 0.5 * avgValue) {
      height = 150;
    } else if (valueDifference < avgValue) {
      height = 200;
    } else {
      height = 400;
    }
    const options = getApexChartLineOptions({
      height,
      colors: mergeArray(this.props.colors, DEFAULT_COLORS),
      displayAxes: this.props.display_axes,
      series: this.props.series,
      locales: [fr, en, de],
      defaultLocale: this.props.user.language,
      activeToolbar: this.props.detailed_view ? true : null,
      dictionary: this.props.detailed_view ? this.props.dictionary : null,
      chartType: this.props.detailed_view ? this.props.chart_type : null,
      eventZoomed: this.props.detailed_view ? this.handleZoom : null
    });
    this.addDateFormatter(options);
    return options;
  };
  getStepLineChartOptions = () => {
    let height;
    const seriesValues = this.props.series.flatMap(serie => serie.data.map(point => point.y));
    const minValue = Math.min(...seriesValues);
    const maxValue = Math.max(...seriesValues);
    const avgValue = seriesValues.reduce((acc, val) => acc + val, 0) / seriesValues.length;
    const valueDifference = maxValue - minValue;
    if (valueDifference < 0.1 * avgValue) {
      height = 80;
    } else if (valueDifference < 0.5 * avgValue) {
      height = 150;
    } else if (valueDifference < avgValue) {
      height = 200;
    } else {
      height = 400;
    }
    const options = getApexChartStepLineOptions({
      height,
      colors: mergeArray(this.props.colors, DEFAULT_COLORS),
      displayAxes: this.props.display_axes,
      series: this.props.series,
      locales: [fr, en, de],
      defaultLocale: this.props.user.language,
      activeToolbar: this.props.detailed_view ? true : null,
      dictionary: this.props.detailed_view ? this.props.dictionary : null,
      chartType: this.props.detailed_view ? this.props.chart_type : null,
      eventZoomed: this.props.detailed_view ? this.handleZoom : null
    });
    this.addDateFormatter(options);
    return options;
  };
  getTimelineChartOptions = () => {
    let height;
    if (this.props.size === 'small' && !this.props.display_axes) {
      height = 40;
    } else if (this.props.size === 'big' && !this.props.display_axes) {
      height = 80;
    } else {
      height = 200;
    }
    const options = getApexChartTimelineOptions({
      height,
      series: this.props.series,
      displayAxes: this.props.display_axes,
      DEFAULT_COLORS,
      locales: [fr, en, de],
      defaultLocale: this.props.user.language,
      activeToolbar: this.props.detailed_view ? true : null,
      dictionary: this.props.detailed_view ? this.props.dictionary : null,
      chartType: this.props.detailed_view ? this.props.chart_type : null,
      eventZoomed: this.props.detailed_view ? this.handleZoom : null
    });
    this.addDateFormatter(options);

    return options;
  };
  handleZoom = (min, max) => {
    this.props.onZoom(min, max);
  };
  displayChart = () => {
    let options;
    if (this.props.chart_type === 'timeline') {
      options = this.getTimelineChartOptions();
    } else if (this.props.chart_type === 'area') {
      options = this.getAreaChartOptions();
    } else if (this.props.chart_type === 'line') {
      options = this.getLineChartOptions();
    } else if (this.props.chart_type === 'stepline') {
      options = this.getStepLineChartOptions();
    } else if (this.props.chart_type === 'bar') {
      options = this.getBarChartOptions();
    } else {
      options = this.getAreaChartOptions();
    }
    if (this.chart) {
      this.chart.updateOptions(options, this.handleZoom);
    } else {
      this.chart = new ApexCharts(this.chartRef.current, options);
      this.chart.render();
    }
  };
  componentDidMount() {
    this.displayChart();
  }
  componentDidUpdate(nextProps) {
    const seriesDifferent = nextProps.series !== this.props.series;
    const chartTypeDifferent = nextProps.chart_type !== this.props.chart_type;
    const displayAxesDifferent = nextProps.display_axes !== this.props.display_axes;
    const intervalDifferent = nextProps.interval !== this.props.interval;
    const sizeDifferent = nextProps.size !== this.props.size;
    const detailedView = nextProps.detailed_view !== this.props.detailed_view;
    if (
      seriesDifferent ||
      chartTypeDifferent ||
      displayAxesDifferent ||
      intervalDifferent ||
      sizeDifferent ||
      detailedView
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
    return (
      <div
        ref={this.chartRef}
        class="chart-auto-height"
        style={{ width: '100%', maxWidth: '100%', margin: '0 auto' }}
      />
    );
  }
}

export default ApexChartComponent;

export { DEFAULT_COLORS, DEFAULT_COLORS_NAME };
