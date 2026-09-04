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
import { createTooltipPositioning } from './apexChartTooltipPositioning';
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
  // One instance for the life of the chart, so the tooltip positioning state
  // (cursor position, observer) survives live data re-renders
  tooltipPositioning = createTooltipPositioning();
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
    // Configure tooltip with date formatter. The tooltip follows the cursor
    // so it doesn't permanently mask the curves (see community feedback)
    options.tooltip = {
      followCursor: true,
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
    this.addHiddenSeriesEvents(options);
    this.tooltipPositioning.addToOptions(options);
    if (this.chart) {
      this.chart.updateOptions(options);
    } else {
      this.chart = new ApexCharts(this.chartRef.current, options);

      this.chart.render();
    }
  };
  // Tell the parent which series are hidden (collapsed through the legend) each time the
  // chart is drawn: after a legend click, after a data refresh (ApexCharts keeps the
  // collapsed series) and when the chart is (re)created (all series visible again).
  // Reading the state of the chart itself, rather than mirroring the legend clicks, keeps
  // the parent in sync whatever ApexCharts did with the click.
  addHiddenSeriesEvents(options) {
    if (!this.props.onHiddenSeriesChange) {
      return;
    }
    const reportHiddenSeries = chartContext => {
      const { collapsedSeriesIndices, ancillaryCollapsedSeriesIndices } = chartContext.w.globals;
      const hiddenSeriesIndexes = [...collapsedSeriesIndices, ...ancillaryCollapsedSeriesIndices].sort((a, b) => a - b);
      this.props.onHiddenSeriesChange(hiddenSeriesIndexes);
    };
    options.chart.events = {
      ...(options.chart.events || {}),
      mounted: reportHiddenSeries,
      updated: reportHiddenSeries
    };
  }
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
      colorsDifferent
    ) {
      this.displayChart();
    }
  }
  componentWillUnmount() {
    this.tooltipPositioning.dispose();
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
