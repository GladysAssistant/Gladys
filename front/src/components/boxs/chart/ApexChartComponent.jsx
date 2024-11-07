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
    if (this.props.interval <= 24 * 60) {
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
  addDateFormatterRangeBar(options) {
    const createTooltipContent = (opts, startDate, endDate) => {
      const w = opts.ctx.w;
      const seriesName = w.config.series[opts.seriesIndex].name ? w.config.series[opts.seriesIndex].name : '';
      const ylabel = w.globals.seriesX[opts.seriesIndex][opts.dataPointIndex];
      const color = w.globals.colors[opts.seriesIndex];

      return `<div class="apexcharts-tooltip-rangebar">
          <div> <span class="series-name" style="color: ${color}">
            ${seriesName ? seriesName : ''}
          </span></div>
          <div> <span class="category">
            ${ylabel}: 
          </span> <span class="value start-value"></br>&nbsp;&nbsp;
              ${dictionnary.start_date}${startDate}
          </span> <span class="value end-value"></br>&nbsp;&nbsp;
              ${dictionnary.end_date}${endDate}
          </span></div>
        </div>`;
    };

    let formatter_custom;
    const dictionnary = this.props.dictionary.dashboard.boxes.chart;
    if (this.props.interval <= 24 * 60) {
      formatter_custom = opts => {
        const startDate = dayjs(opts.y1)
          .locale(this.props.user.language)
          .format('LL - LTS');
        const endDate = dayjs(opts.y2)
          .locale(this.props.user.language)
          .format('LL - LTS');

        return createTooltipContent(opts, startDate, endDate);
      };
    } else {
      formatter_custom = opts => {
        const startDate = dayjs(opts.y1)
          .locale(this.props.user.language)
          .format('LL');
        const endDate = dayjs(opts.y2)
          .locale(this.props.user.language)
          .format('LL');

        return createTooltipContent(opts, startDate, endDate);
      };
    }
    options.tooltip.custom = function(opts) {
      return formatter_custom(opts);
    };
  }
  getBarChartOptions = () => {
    const options = getApexChartBarOptions({
      displayAxes: this.props.display_axes,
      series: this.props.series,
      colors: mergeArray(this.props.colors, DEFAULT_COLORS),
      locales: [fr, en, de],
      defaultLocale: this.props.user.language
    });
    this.addDateFormatter(options);
    return options;
  };
  getAreaChartOptions = () => {
    let height;
    if (this.props.size === 'small' && !this.props.display_axes) {
      height = 40;
    } else if (this.props.size === 'big' && !this.props.display_axes) {
      height = 80;
    } else {
      height = 200 + this.props.additionalHeight;
    }
    const options = getApexChartAreaOptions({
      height,
      series: this.props.series,
      displayAxes: this.props.display_axes,
      colors: mergeArray(this.props.colors, DEFAULT_COLORS),
      locales: [fr, en, de],
      defaultLocale: this.props.user.language
    });
    this.addDateFormatter(options);

    return options;
  };
  getLineChartOptions = () => {
    let height;
    if (this.props.size === 'small' && !this.props.display_axes) {
      height = 40;
    } else if (this.props.size === 'big' && !this.props.display_axes) {
      height = 80;
    } else {
      height = 200 + this.props.additionalHeight;
    }
    const options = getApexChartLineOptions({
      height,
      colors: mergeArray(this.props.colors, DEFAULT_COLORS),
      displayAxes: this.props.display_axes,
      series: this.props.series,
      locales: [fr, en, de],
      defaultLocale: this.props.user.language
    });
    this.addDateFormatter(options);
    return options;
  };
  getStepLineChartOptions = () => {
    let height;
    if (this.props.size === 'small' && !this.props.display_axes) {
      height = 40;
    } else if (this.props.size === 'big' && !this.props.display_axes) {
      height = 80;
    } else {
      height = 200 + this.props.additionalHeight;
    }
    const options = getApexChartStepLineOptions({
      height,
      colors: mergeArray(this.props.colors, DEFAULT_COLORS),
      displayAxes: this.props.display_axes,
      series: this.props.series,
      locales: [fr, en, de],
      defaultLocale: this.props.user.language
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
      // 95 is the height display of the timeline chart when there is no additional height
      height = 95 + this.props.additionalHeight;
    }
    const options = getApexChartTimelineOptions({
      height,
      colors: mergeArray(this.props.colors, DEFAULT_COLORS),
      displayAxes: this.props.display_axes,
      series: this.props.series,
      locales: [fr, en, de],
      defaultLocale: this.props.user.language
    });
    this.addDateFormatterRangeBar(options);
    return options;
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
    const seriesDifferent = nextProps.series !== this.props.series;
    const chartTypeDifferent = nextProps.chart_type !== this.props.chart_type;
    const displayAxesDifferent = nextProps.display_axes !== this.props.display_axes;
    const intervalDifferent = nextProps.interval !== this.props.interval;
    const sizeDifferent = nextProps.size !== this.props.size;
    const additionalHeightDifferent = nextProps.additionalHeight !== this.props.additionalHeight;
    if (
      seriesDifferent ||
      chartTypeDifferent ||
      displayAxesDifferent ||
      intervalDifferent ||
      sizeDifferent ||
      additionalHeightDifferent
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

export { DEFAULT_COLORS, DEFAULT_COLORS_NAME };
