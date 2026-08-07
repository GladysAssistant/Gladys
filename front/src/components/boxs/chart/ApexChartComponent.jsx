import { Component, createRef } from 'preact';
import ApexCharts from 'apexcharts';

import fr from 'apexcharts/dist/locales/fr.json';
import en from 'apexcharts/dist/locales/en.json';
import de from 'apexcharts/dist/locales/de.json';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { connect } from 'unistore/preact';
import {
  DEFAULT_TIMEZONE,
  formatInSystemTimezone,
  getTooltipDateFormatForInterval,
  getXAxisDateFormatForInterval
} from '../../../utils/systemTimezone';
import { getApexChartBarOptions } from './ApexChartBarOptions';
import { getApexChartAreaOptions } from './ApexChartAreaOptions';
import { getApexChartLineOptions } from './ApexChartLineOptions';
import { getApexChartStepLineOptions } from './ApexChartStepLineOptions';
import { getApexChartTimelineOptions } from './ApexChartTimelineOptions';
import mergeArray from '../../../utils/mergeArray';

dayjs.extend(utc);
dayjs.extend(timezone);
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

  getTimezone = () => {
    return this.props.systemTimezone || DEFAULT_TIMEZONE;
  };

  formatDate = (timestamp, format) => {
    return formatInSystemTimezone(timestamp, format, this.props.user.language, this.getTimezone());
  };

  addXAxisDateFormatter(options) {
    const xAxisFormat = this.props.xAxisDateFormat || getXAxisDateFormatForInterval(this.props.interval);
    if (!options.xaxis) {
      options.xaxis = {};
    }
    if (!options.xaxis.labels) {
      options.xaxis.labels = {};
    }
    options.xaxis.labels.formatter = (value, timestamp) => {
      const dateValue = timestamp || value;
      if (!dateValue) {
        return '';
      }
      return this.formatDate(dateValue, xAxisFormat);
    };
  }

  addDateFormatter(options) {
    const tooltipFormat = getTooltipDateFormatForInterval(this.props.interval);
    const formatter = value => {
      return this.formatDate(value, tooltipFormat);
    };
    // Configure tooltip with fixed position and date formatter
    options.tooltip = {
      followCursor: false,
      fixed: {
        enabled: true,
        position: 'topLeft',
        offsetX: 0,
        offsetY: -30
      },
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
        const startDate = this.formatDate(opts.y1, 'LL - LTS');
        const endDate = this.formatDate(opts.y2, 'LL - LTS');

        return createTooltipContent(opts, startDate, endDate);
      };
    } else {
      formatter_custom = opts => {
        const startDate = this.formatDate(opts.y1, 'LL');
        const endDate = this.formatDate(opts.y2, 'LL');

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
      hideLegend: this.props.hide_legend,
      series: this.props.series,
      colors: mergeArray(this.props.colors, DEFAULT_COLORS),
      locales: [fr, en, de],
      defaultLocale: this.props.user.language,
      yAxisFormatter: this.props.y_axis_formatter,
      yAxisUnit: this.props.y_axis_unit,
      disableZoom: this.props.disable_zoom
    });
    this.addDateFormatter(options);
    // Apply custom tooltip formatters if provided
    if (this.props.tooltip_x_formatter || this.props.tooltip_y_formatter) {
      if (!options.tooltip) {
        options.tooltip = {};
      }
      if (this.props.tooltip_x_formatter) {
        options.tooltip.x = { formatter: this.props.tooltip_x_formatter };
      }
      if (this.props.tooltip_y_formatter) {
        options.tooltip.y = { formatter: this.props.tooltip_y_formatter };
      }
    }
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
    this.addXAxisDateFormatter(options);
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
    const hideLegendDifferent = nextProps.hide_legend !== this.props.hide_legend;
    const intervalDifferent = nextProps.interval !== this.props.interval;
    const sizeDifferent = nextProps.size !== this.props.size;
    const additionalHeightDifferent = nextProps.additionalHeight !== this.props.additionalHeight;
    const yAxisFormatterDifferent = nextProps.y_axis_formatter !== this.props.y_axis_formatter;
    const yAxisUnitDifferent = nextProps.y_axis_unit !== this.props.y_axis_unit;
    const colorsDifferent = nextProps.colors !== this.props.colors;
    const systemTimezoneDifferent = nextProps.systemTimezone !== this.props.systemTimezone;
    const xAxisDateFormatDifferent = nextProps.xAxisDateFormat !== this.props.xAxisDateFormat;
    if (
      seriesDifferent ||
      chartTypeDifferent ||
      displayAxesDifferent ||
      hideLegendDifferent ||
      intervalDifferent ||
      sizeDifferent ||
      additionalHeightDifferent ||
      yAxisFormatterDifferent ||
      yAxisUnitDifferent ||
      colorsDifferent ||
      systemTimezoneDifferent ||
      xAxisDateFormatDifferent
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

export default connect('systemTimezone')(ApexChartComponent);

export { DEFAULT_COLORS, DEFAULT_COLORS_NAME };
