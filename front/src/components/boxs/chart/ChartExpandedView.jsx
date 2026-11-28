import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import BottomSheet from '../../sheet/BottomSheet';
import ApexChartComponent, { DEFAULT_COLORS } from './ApexChartComponent';
import ChartPeriodToolbar from './ChartPeriodToolbar';
import ChartHeaderValues from './ChartHeaderValues';
import mergeArray from '../../../utils/mergeArray';
import {
  getHeaderValues,
  getRangeLabel,
  getSeriesStats,
  getNiceRange,
  getSeriesTimeRange,
  getPinchRange,
  roundWith2DecimalIfNeeded
} from './chartUtils';
import style from './style.css';

const STAT_COLUMNS = ['min', 'avg', 'max', 'last'];
// a binary chart gets taller rows than in its card (55px), not the height of the screen: a bar
// says nothing more by being taller
const TIMELINE_ROW_HEIGHT = 80;

const formatStat = value => (value === null || value === undefined ? '–' : roundWith2DecimalIfNeeded(value));

/**
 * @description The chart of a card, enlarged over the dashboard to be read closely: the same
 * period as the card (one state, driven from either), axes always drawn, a zoom on the x axis and,
 * for the value charts, a table of the series — min / average / max / last over what is on screen —
 * that is also the legend: a row shows or hides its series.
 *
 * The zoom is held here and handed to the chart (`x_range`): a mouse drags a selection on the
 * chart (ApexCharts), two fingers pinch it (ApexCharts has no touch zoom: the gesture is read
 * here), and either way the table and the "reset zoom" pill follow the same range.
 *
 * The series a row hides are filtered out of what the chart is given, rather than collapsed
 * through ApexCharts: the table stays the one source of what is shown, two series with the same
 * name are told apart, and a hidden series survives a zoom or a new period.
 */
class ChartExpandedView extends Component {
  state = {
    hiddenSeriesIndexes: [],
    zoomRange: null
  };

  componentWillReceiveProps(nextProps) {
    const opening = nextProps.open && !this.props.open;
    const devicesChanged = nextProps.seriesKey !== this.props.seriesKey;
    const periodChanged = nextProps.interval !== this.props.interval || nextProps.offset !== this.props.offset;
    const loaded = nextProps.series !== this.props.series || (this.props.loading && !nextProps.loading);
    // Between a change of period and its values, the chart still shows the previous period: a
    // zoom started there would be a range of that period, applied to the next one
    if (periodChanged) {
      this.waitingForPeriod = true;
    } else if (loaded) {
      this.waitingForPeriod = false;
    }
    // a view opens on the whole period with every series, and a zoom belongs to the period it
    // was made on — a pinch under way included
    if (opening || devicesChanged || periodChanged) {
      this.stopPinch({ discard: true });
    }
    if (opening || devicesChanged) {
      this.setState({ hiddenSeriesIndexes: [], zoomRange: null });
    } else if (periodChanged && this.state.zoomRange) {
      this.setState({ zoomRange: null });
    }
  }

  componentWillUnmount() {
    this.setChartRef(null);
  }

  // ---------- pinch to zoom ----------

  // The start of a gesture is listened to on the chart, by hand (a ref): the rest of it is
  // listened to on the elements the fingers landed on. The chart is drawn again at each step of
  // a pinch, which replaces those elements — and a touch keeps being sent to the element it
  // started on, from where it no longer bubbles up to here once that element left the page.
  setChartRef = element => {
    if (this.chartElement === element) {
      return;
    }
    if (this.chartElement) {
      this.chartElement.removeEventListener('touchstart', this.onTouchStart);
    }
    this.chartElement = element;
    if (!element) {
      this.stopPinch();
    }
    if (element) {
      element.addEventListener('touchstart', this.onTouchStart, { passive: true });
    }
  };

  // discard: the gesture is dropped where it is (the period it was made on is gone), instead of
  // ending on its last step
  stopPinch = ({ discard } = {}) => {
    if (!this.pinch) {
      return;
    }
    this.pinch.targets.forEach(target => {
      target.removeEventListener('touchmove', this.onTouchMove);
      target.removeEventListener('touchend', this.endPinch);
      target.removeEventListener('touchcancel', this.endPinch);
    });
    const { frame, range } = this.pinch;
    this.pinch = null;
    if (frame) {
      cancelAnimationFrame(frame);
      // the fingers left before the last step was drawn: it is drawn now, the gesture ends where
      // they were
      if (!discard && this.chartElement) {
        this.setState({ zoomRange: range });
      }
    }
  };

  // the listener of the end of a touch: its event is not an option of stopPinch
  endPinch = () => this.stopPinch();

  // Where two fingers are: how far apart, and where their middle is along the plot (0 to 1)
  readPinch = (touches, plot) => ({
    distance: Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY),
    ratio: Math.min(1, Math.max(0, ((touches[0].clientX + touches[1].clientX) / 2 - plot.left) / plot.width))
  });

  onTouchStart = event => {
    this.stopPinch();
    const grid = this.chartElement.querySelector('.apexcharts-grid');
    const fullRange = Array.isArray(this.props.series) ? getSeriesTimeRange(this.props.series) : null;
    if (event.touches.length !== 2 || !grid || !fullRange || this.waitingForPeriod) {
      return;
    }
    // the plot is measured once, for the same reason
    const plot = grid.getBoundingClientRect();
    if (plot.width <= 0) {
      return;
    }
    const range = this.state.zoomRange || fullRange;
    const { distance, ratio } = this.readPinch(event.touches, plot);
    const targets = Array.from(new Set([event.touches[0].target, event.touches[1].target]));
    this.pinch = {
      plot,
      fullRange,
      targets,
      frame: null,
      start: {
        span: range.max - range.min,
        distance: Math.max(1, distance),
        anchor: range.min + ratio * (range.max - range.min)
      }
    };
    targets.forEach(target => {
      // not passive: the browser must not zoom the page while the chart is pinched
      target.addEventListener('touchmove', this.onTouchMove, { passive: false });
      target.addEventListener('touchend', this.endPinch);
      target.addEventListener('touchcancel', this.endPinch);
    });
  };

  onTouchMove = event => {
    const pinch = this.pinch;
    if (!pinch || event.touches.length !== 2) {
      return;
    }
    if (event.cancelable) {
      event.preventDefault();
    }
    const { distance, ratio } = this.readPinch(event.touches, pinch.plot);
    pinch.range = getPinchRange(pinch.start, distance, ratio, pinch.fullRange);
    // one draw per frame, whatever the pace of the touch events
    if (!pinch.frame) {
      pinch.frame = requestAnimationFrame(() => {
        pinch.frame = null;
        this.setState({ zoomRange: pinch.range });
      });
    }
  };

  // A selection dragged while the values of a new period are awaited is not kept: the chart is
  // drawn again with those values, on the whole period
  handleZoomChange = zoomRange => {
    if (!this.waitingForPeriod) {
      this.setState({ zoomRange });
    }
  };

  resetZoom = () => {
    this.setState({ zoomRange: null });
  };

  toggleSeries = index => {
    this.setState(({ hiddenSeriesIndexes }) => {
      if (hiddenSeriesIndexes.includes(index)) {
        return { hiddenSeriesIndexes: hiddenSeriesIndexes.filter(hiddenIndex => hiddenIndex !== index) };
      }
      // the last series on screen stays: an empty chart explains nothing
      if (hiddenSeriesIndexes.length + 1 >= (this.props.series || []).length) {
        return null;
      }
      return { hiddenSeriesIndexes: [...hiddenSeriesIndexes, index].sort((a, b) => a - b) };
    });
  };

  // The colors of the series, in the order of the series: the ones picked in the box, completed
  // by the default palette
  getColors = () => {
    const colors = mergeArray(this.props.box.colors, DEFAULT_COLORS);
    return (this.props.series || []).map((oneSeries, index) => colors[index % colors.length]);
  };

  // What the chart draws. The same arrays are returned as long as nothing changed: the chart
  // redraws when it is given new ones.
  getVisible = (series, colors, hiddenSeriesIndexes) => {
    const cache = this.visibleCache;
    if (
      cache &&
      cache.series === series &&
      cache.hiddenSeriesIndexes === hiddenSeriesIndexes &&
      cache.colors.join() === colors.join()
    ) {
      return cache.visible;
    }
    const isVisible = (item, index) => !hiddenSeriesIndexes.includes(index);
    const visible = { series: series.filter(isVisible), colors: colors.filter(isVisible) };
    this.visibleCache = { series, colors, hiddenSeriesIndexes, visible };
    return visible;
  };

  getStats = (series, zoomRange) => {
    const cache = this.statsCache;
    if (cache && cache.series === series && cache.zoomRange === zoomRange) {
      return cache.stats;
    }
    const stats = getSeriesStats(series, zoomRange);
    this.statsCache = { series, zoomRange, stats };
    return stats;
  };

  // The y axis follows a zoom: fitted on the values of the series shown, over the range zoomed
  // on. Not for the bars, which are stacked: their height is a sum the stats do not hold. The
  // same object is returned as long as nothing changed, like the series.
  getYRange = (stats, hiddenSeriesIndexes, zoomRange) => {
    if (!zoomRange || this.props.box.chart_type === 'bar') {
      return null;
    }
    const cache = this.yRangeCache;
    if (cache && cache.stats === stats && cache.hiddenSeriesIndexes === hiddenSeriesIndexes) {
      return cache.yRange;
    }
    const visibleStats = stats.filter((oneStats, index) => oneStats && !hiddenSeriesIndexes.includes(index));
    const min = Math.min(...visibleStats.map(oneStats => oneStats.min));
    const max = Math.max(...visibleStats.map(oneStats => oneStats.max));
    const yRange = visibleStats.length > 0 && max > min ? getNiceRange(min, max) : null;
    this.yRangeCache = { stats, hiddenSeriesIndexes, yRange };
    return yRange;
  };

  renderStats(series, colors) {
    const { hiddenSeriesIndexes, zoomRange } = this.state;
    const stats = this.getStats(series, zoomRange);
    const labels = this.props.dictionary.dashboard.boxes.chart;
    // a lone series has nothing to be told apart from, and cannot be hidden
    const canToggle = series.length > 1;
    return (
      <table class={style.statsTable} data-cy="chart-expanded-stats">
        <thead>
          <tr>
            <th scope="col">
              <span class="sr-only">
                <Text id="dashboard.boxes.chart.series" />
              </span>
            </th>
            {STAT_COLUMNS.map(column => (
              <th scope="col" key={column}>
                <Text id={`dashboard.boxes.chart.stats.${column}`} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {series.map((oneSeries, index) => {
            const hidden = hiddenSeriesIndexes.includes(index);
            const oneStats = stats[index];
            return (
              <tr
                key={index}
                class={cx({ [style.statsRow]: canToggle, [style.statsRowHidden]: hidden })}
                onClick={canToggle ? () => this.toggleSeries(index) : undefined}
              >
                <th scope="row">
                  {canToggle ? (
                    <button
                      type="button"
                      class={style.statsSeries}
                      aria-pressed={hidden ? 'false' : 'true'}
                      title={hidden ? labels.showSeries : labels.hideSeries}
                    >
                      <span
                        class={style.statsDot}
                        style={{ backgroundColor: hidden ? 'transparent' : colors[index] }}
                      />
                      <span class={style.statsName}>{oneSeries.name}</span>
                    </button>
                  ) : (
                    <span class={style.statsSeries}>
                      <span class={style.statsDot} style={{ backgroundColor: colors[index] }} />
                      <span class={style.statsName}>{oneSeries.name}</span>
                    </span>
                  )}
                </th>
                {STAT_COLUMNS.map(column => (
                  <td key={column}>{formatStat(oneStats && oneStats[column])}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  render(
    {
      open,
      onClose,
      box,
      user,
      dictionary,
      series,
      seriesKey,
      interval,
      offset,
      loading,
      emptySeries,
      error,
      errorDetail,
      featuresSummary,
      unit,
      variationDownIsPositive,
      nbFeaturesDisplayed,
      onPrevious,
      onNext,
      onBackToNow,
      onSelectInterval
    },
    { hiddenSeriesIndexes, zoomRange }
  ) {
    const isTimeline = box.chart_type === 'timeline';
    // an error takes the place of the chart: what it would show may be the period before
    const hasData = !error && emptySeries === false && Array.isArray(series);
    const colors = this.getColors();
    // a binary chart keeps the legend of the chart: its two series are "on" and "off", not devices
    const visible = hasData && !isTimeline ? this.getVisible(series, colors, hiddenSeriesIndexes) : null;
    const displayHeaderValues = box.display_variation && !isTimeline && hasData;
    // The zoom: how to start one or, once zoomed, the range shown and the way back. It sits
    // beside the period when there is no headline to put there.
    const zoomBar = (
      <div class={style.zoomBar}>
        {zoomRange ? (
          <button
            type="button"
            class={style.zoomReset}
            onClick={this.resetZoom}
            title={dictionary.dashboard.boxes.chart.resetZoom}
            data-cy="chart-expanded-reset-zoom"
          >
            <i class="fe fe-zoom-out" />
            <span class={style.zoomRange}>{getRangeLabel(zoomRange, user.language)}</span>
            {/* a phone has no room for the words: the cross says it there (and the title) */}
            <span class={style.zoomResetLabel}>
              <Text id="dashboard.boxes.chart.resetZoom" />
            </span>
            <i class={cx('fe fe-x', style.zoomResetClose)} />
          </button>
        ) : (
          hasData && (
            <span class={style.zoomHint}>
              <i class="fe fe-zoom-in" />
              <span class={style.zoomHintMouse}>
                <Text id="dashboard.boxes.chart.zoomHint" />
              </span>
              <span class={style.zoomHintTouch}>
                <Text id="dashboard.boxes.chart.zoomHintTouch" />
              </span>
            </span>
          )
        )}
      </div>
    );
    return (
      <BottomSheet
        open={open}
        onClose={onClose}
        title={box.title || dictionary.dashboard.boxTitle.chart}
        size={isTimeline ? 'wide' : 'wide-full'}
        dataCy="chart-expanded"
      >
        <div class={style.expanded}>
          <div class={style.expandedTop}>
            {displayHeaderValues ? (
              <ChartHeaderValues
                unit={unit}
                variationDownIsPositive={variationDownIsPositive}
                {...getHeaderValues(featuresSummary, hiddenSeriesIndexes)}
              />
            ) : (
              zoomBar
            )}
            <div class={style.expandedToolbar}>
              <ChartPeriodToolbar
                interval={interval}
                offset={offset}
                chartType={box.chart_type}
                language={user.language}
                dictionary={dictionary}
                onPrevious={onPrevious}
                onNext={onNext}
                onBackToNow={onBackToNow}
                onSelectInterval={onSelectInterval}
              />
            </div>
          </div>

          {displayHeaderValues && zoomBar}

          {/* the chart keeps its touches: a finger reading the values must not drag the sheet */}
          <div
            class={cx(style.expandedChart, {
              [style.expandedChartFill]: hasData && !isTimeline,
              [style.expandedChartLoading]: loading
            })}
            data-no-sheet-drag
            ref={this.setChartRef}
          >
            {error && (
              <div class={style.expandedMessage}>
                <div>
                  <i class="fe fe-alert-circle mr-2" />
                  {error}
                </div>
                {errorDetail && <div>{errorDetail}</div>}
              </div>
            )}
            {!error && emptySeries === true && (
              <div class={style.expandedMessage}>
                <div>
                  <i class="fe fe-alert-circle mr-2" />
                  <Text id="dashboard.boxes.chart.noValue" />
                </div>
              </div>
            )}
            {/* opened while the card loads its first values */}
            {!error && emptySeries === undefined && (
              <div class={cx('dimmer', 'active', style.expandedMessage)}>
                <div class="loader" />
              </div>
            )}
            {hasData && (
              <div class={style.expandedChartInner}>
                <ApexChartComponent
                  key={seriesKey}
                  series={visible ? visible.series : series}
                  colors={visible ? visible.colors : box.colors}
                  interval={interval}
                  user={user}
                  size="big"
                  chart_type={box.chart_type}
                  display_axes
                  hide_legend={!isTimeline}
                  fill_container={!isTimeline}
                  additionalHeight={isTimeline ? TIMELINE_ROW_HEIGHT * nbFeaturesDisplayed : 0}
                  dictionary={dictionary}
                  x_range={zoomRange}
                  // not given to a binary chart: its y axis is the list of the devices
                  y_range={
                    visible
                      ? this.getYRange(this.getStats(series, zoomRange), hiddenSeriesIndexes, zoomRange)
                      : undefined
                  }
                  onZoomChange={this.handleZoomChange}
                />
              </div>
            )}
          </div>

          {hasData && !isTimeline && this.renderStats(series, colors)}
        </div>
      </BottomSheet>
    );
  }
}

export default ChartExpandedView;
