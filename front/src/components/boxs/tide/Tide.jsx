import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezonePlugin from 'dayjs/plugin/timezone';

import style from './style.css';

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const REFRESH_INTERVAL_MS = 60 * 1000;

// A coefficient at or above this is a "grande marée": worth pointing out, since
// it is the threshold French tide tables use to flag remarkable spring tides.
const HIGH_TIDE_COEFFICIENT_THRESHOLD = 100;

// How many days the widget lets the user step through, today included. Matches
// MAX_FORECAST_DAYS on the server, which clamps the day it will compute.
const FORECAST_DAYS = 7;

/**
 * Read a date in the timezone the values were computed in. The browser may sit
 * in another one: without this, a dashboard opened from abroad would shift the
 * tide times by the difference.
 */
const inHouseTimezone = (date, timezone) => (timezone ? dayjs(date).tz(timezone) : dayjs(date));

const formatTime = (time, timezone) => (time ? inHouseTimezone(time, timezone).format('HH[h]mm') : '--h--');

/**
 * Time left before the next tide, read the way a tide clock is: "3h20" rather
 * than a decimal number of hours.
 */
const formatHoursLeft = hours => {
  const totalMinutes = Math.round(hours * 60);
  const wholeHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (wholeHours === 0) {
    return `${minutes}min`;
  }
  return `${wholeHours}h${String(minutes).padStart(2, '0')}`;
};

/** Heights read as "9,13m" in French and "9.13m" in English, hence toLocaleString. */
const formatHeight = (height, language) =>
  `${height.toLocaleString(language || 'en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}m`;

/**
 * The tide clock of the mockup: a dial whose single hand walks from low water
 * to high water and back, so the state of the sea reads at a glance without
 * parsing any number. The hand points up at high tide and down at low tide,
 * like the tide clocks sold in harbours.
 */
const TideClock = ({ tideState, gradientId }) => {
  const { previous_tide: previousTide, next_high_tide: nextHighTide, next_low_tide: nextLowTide } = tideState;
  // The tide currently being sailed towards is the earliest of the two.
  const nextTide =
    nextHighTide && nextLowTide
      ? [nextHighTide, nextLowTide].sort((a, b) => new Date(a.time) - new Date(b.time))[0]
      : nextHighTide || nextLowTide;

  let progress = 0.5;
  if (previousTide && nextTide) {
    const from = new Date(previousTide.time).getTime();
    const to = new Date(nextTide.time).getTime();
    const elapsed = Date.now() - from;
    const total = to - from;
    if (total > 0) {
      progress = Math.min(1, Math.max(0, elapsed / total));
    }
  }

  // Half a turn per half-cycle: the hand points down at low water and up at
  // high water, sweeping up the left side while the sea rises and back down
  // the right side while it falls, like the tide clocks sold in harbours.
  const rising = tideState.rising === true;
  const angle = rising ? 180 + progress * 180 : progress * 180;
  const toPoint = (degrees, radius) => {
    const radians = ((degrees - 90) * Math.PI) / 180;
    return { x: 50 + radius * Math.cos(radians), y: 50 + radius * Math.sin(radians) };
  };
  const hand = toPoint(angle, 33);

  // Hours left before the next tide, the number a tide clock is read for. The
  // dial is graduated 1 to 5 down each side, so the hand points at roughly the
  // hours remaining: 6 would be the opposite tide, which is already labelled.
  const hoursLeft = nextTide ? (new Date(nextTide.time).getTime() - Date.now()) / (60 * 60 * 1000) : null;

  // The hour numbers: on a tide clock they count down to the next tide, so they
  // run down the rising side and back up the falling one.
  const hourMarks = [];
  for (let hour = 1; hour <= 5; hour += 1) {
    // Each hour is a sixth of a half-cycle, so 30 degrees of dial
    const risingAngle = 180 + (6 - hour) * 30;
    const fallingAngle = (6 - hour) * 30;
    hourMarks.push({ hour, angle: risingAngle, key: `rising-${hour}` });
    hourMarks.push({ hour, angle: fallingAngle, key: `falling-${hour}` });
  }

  return (
    <svg viewBox="0 0 100 100" class={`${style.tideClock} dark-mode-no-invert`}>
      <defs>
        {/* The dial is filled like a harbour tide clock: the water it stands
          for is deep at high tide, at the top, and shallow at the bottom. */}
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" class={style.tideClockWaterTop} />
          <stop offset="100%" class={style.tideClockWaterBottom} />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="47" class={style.tideClockRim} />
      <circle cx="50" cy="50" r="43" fill={`url(#${gradientId})`} class={style.tideClockFace} />

      {/* Minute-like ticks, one per half hour of the cycle */}
      {Array.from({ length: 24 }, (_, index) => {
        const tickAngle = index * 15;
        const outer = toPoint(tickAngle, 43);
        const inner = toPoint(tickAngle, index % 2 === 0 ? 38 : 40.5);
        return (
          <line
            key={`tick-${tickAngle}`}
            x1={outer.x.toFixed(2)}
            y1={outer.y.toFixed(2)}
            x2={inner.x.toFixed(2)}
            y2={inner.y.toFixed(2)}
            class={style.tideClockTick}
          />
        );
      })}

      {/* The hours left before the next tide, down each side of the dial */}
      {hourMarks.map(mark => {
        const position = toPoint(mark.angle, 31);
        return (
          <text
            key={mark.key}
            x={position.x.toFixed(2)}
            y={position.y.toFixed(2)}
            class={style.tideClockHourNumber}
            text-anchor="middle"
            dominant-baseline="central"
          >
            {mark.hour}
          </text>
        );
      })}

      {/* High water at the top, low water at the bottom, as on every tide clock */}
      <text x="50" y="16" class={style.tideClockLabel} text-anchor="middle" dominant-baseline="central">
        <Text id="dashboard.boxes.tide.highTideShort" />
      </text>
      <text x="50" y="84" class={style.tideClockLabel} text-anchor="middle" dominant-baseline="central">
        <Text id="dashboard.boxes.tide.lowTideShort" />
      </text>

      <line x1="50" y1="50" x2={hand.x.toFixed(2)} y2={hand.y.toFixed(2)} class={style.tideClockHand} />
      <circle cx="50" cy="50" r="4.5" class={style.tideClockHub} />
      {/* What the hand is pointing at, spelled out under the hub: a tide clock
        is read for the time left, and the dial only shows whole hours. */}
      {hoursLeft !== null && hoursLeft >= 0 && (
        <text x="50" y="64" class={style.tideClockCountdown} text-anchor="middle" dominant-baseline="central">
          {formatHoursLeft(hoursLeft)}
        </text>
      )}
    </svg>
  );
};

/**
 * The week ahead, as a row of day tabs on the widget itself. Picking a day
 * redraws the curve for that day: a week drawn at once would pile a dozen
 * tides into a few hundred pixels, where nothing can be read any more.
 */
const TideDayTabs = ({ dayOffset, onSelectDay, timezone, language }) => {
  const today = inHouseTimezone(new Date(), timezone);
  const days = [];
  for (let offset = 0; offset < FORECAST_DAYS; offset += 1) {
    const day = today.add(offset, 'day').locale(language || 'en');
    days.push({
      offset,
      weekday: offset === 0 ? null : day.format('ddd'),
      date: day.format('DD/MM')
    });
  }
  return (
    <div class={style.tideDayTabs}>
      {days.map(day => (
        <button
          key={day.offset}
          type="button"
          class={`${style.tideDayTab} ${day.offset === dayOffset ? style.tideDayTabActive : ''}`}
          onClick={() => onSelectDay(day.offset)}
        >
          <span class={style.tideDayTabName}>
            {day.weekday === null ? <Text id="dashboard.boxes.tide.today" /> : day.weekday}
          </span>
          <span class={style.tideDayTabDate}>{day.date}</span>
        </button>
      ))}
    </div>
  );
};

/**
 * The 24-hour tide curve of the local day, drawn as a filled area so the shape
 * of the sea reads even at a glance. A marker sits on the current level, which
 * is what makes the curve tell "where we are" and not only "what happens today".
 */
const TideCurve = ({ tideState, timezone, language }) => {
  const { curve, day_tides: dayTides } = tideState;
  if (!curve || curve.length < 2) {
    return null;
  }
  // The viewBox keeps its own aspect ratio, so the labels drawn inside it are
  // never stretched sideways by the width the card happens to have.
  const width = 340;
  const height = 158;
  // Room above the curve for the tide labels and, above them, the coefficient
  // badges; and room below it for the hour axis.
  const topPadding = 54;
  const bottomPadding = 20;
  const plotHeight = height - topPadding - bottomPadding;

  const heights = curve.map(point => point.height);
  const minHeight = Math.min(...heights);
  const maxHeight = Math.max(...heights);
  // A flat sea would divide by zero; a one-meter span keeps the curve centered.
  const span = maxHeight - minHeight || 1;
  const firstTime = new Date(curve[0].time).getTime();
  const lastTime = new Date(curve[curve.length - 1].time).getTime();
  const timeSpan = lastTime - firstTime || 1;

  const toX = time => ((new Date(time).getTime() - firstTime) / timeSpan) * width;
  const toY = height_ => topPadding + plotHeight - ((height_ - minHeight) / span) * plotHeight;

  const points = curve.map(point => `${toX(point.time).toFixed(1)},${toY(point.height).toFixed(1)}`);
  const areaPath = `M ${points[0]} L ${points.join(' L ')} L ${width},${height - bottomPadding} L 0,${height -
    bottomPadding} Z`;
  const linePath = `M ${points.join(' L ')}`;

  const now = Date.now();
  const nowInRange = now >= firstTime && now <= lastTime;
  const nowX = nowInRange ? toX(now) : null;
  const nowY = nowInRange ? toY(tideState.current_height) : null;

  // Hour marks every six hours, the rhythm a tide roughly follows.
  const hourMarks = [];
  for (let hour = 0; hour <= 24; hour += 6) {
    const markTime = firstTime + hour * 60 * 60 * 1000;
    if (markTime <= lastTime) {
      hourMarks.push({
        x: toX(markTime),
        label: hour === 24 ? '24h' : `${String(hour).padStart(2, '0')}h`,
        key: `hour-${hour}`
      });
    }
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} class={`${style.tideCurve} dark-mode-no-invert`}>
      <path d={areaPath} class={style.tideCurveArea} />
      <path d={linePath} class={style.tideCurveLine} vector-effect="non-scaling-stroke" />

      {/* Hour axis, so a time can be read off the curve */}
      <line
        x1="0"
        y1={height - bottomPadding}
        x2={width}
        y2={height - bottomPadding}
        class={style.tideCurveAxis}
        vector-effect="non-scaling-stroke"
      />
      {hourMarks.map(mark => (
        <text
          key={mark.key}
          x={Math.min(width - 10, Math.max(10, mark.x))}
          y={height - 7}
          class={style.tideCurveAxisLabel}
          text-anchor="middle"
        >
          {mark.label}
        </text>
      ))}

      {/* Each tide of the day, annotated where it happens: without this the
        curve shows a shape but no value can be read off it. */}
      {(dayTides || []).map(tide => {
        const x = toX(tide.time);
        const y = toY(tide.height);
        // Labels stay centered on their tide, but never so close to an edge
        // that they get clipped: a tide near midnight would otherwise lose
        // half of its time and height.
        const labelHalfWidth = 17;
        const labelX = Math.min(width - labelHalfWidth, Math.max(labelHalfWidth, x));
        // Low tide labels are lifted clear of their point, and all of them by
        // the same amount: the "now" marker crosses a tide every six hours or
        // so, and a label that only moved when the marker came near would
        // leave the two low tides of a day sitting at different heights.
        const lift = tide.high ? 0 : 8;
        // Both labels sit above their point: a low tide is drawn near the
        // bottom of the plot, where anything written under it would fall on
        // the hour axis or straight out of the viewBox.
        const timeY = y - 16 - lift;
        const heightY = y - 6 - lift;
        return (
          <g key={tide.time}>
            <circle cx={x} cy={y} r="2.5" class={style.tideCurveExtremeDot} />
            <text x={labelX} y={timeY} class={style.tideCurveExtremeTime} text-anchor="middle">
              {formatTime(tide.time, timezone)}
            </text>
            <text x={labelX} y={heightY} class={style.tideCurveExtremeHeight} text-anchor="middle">
              {formatHeight(tide.height, language)}
            </text>
            {/* The coefficient of that very tide, above its crest, the way
                tide tables print one per high tide and not one per day. */}
            {tide.high && tide.coefficient !== null && tide.coefficient !== undefined && (
              <g>
                <rect
                  x={labelX - 13}
                  y={y - 46}
                  width="26"
                  height="16"
                  rx="4"
                  class={`${style.tideCurveCoefficientBox} ${
                    tide.coefficient >= HIGH_TIDE_COEFFICIENT_THRESHOLD ? style.tideCurveCoefficientBoxHigh : ''
                  }`}
                />
                <text x={labelX} y={y - 35} class={style.tideCurveCoefficientText} text-anchor="middle">
                  {tide.coefficient}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {nowInRange && (
        <g>
          <line
            x1={nowX}
            y1={topPadding - 6}
            x2={nowX}
            y2={height - bottomPadding}
            class={style.tideCurveNowLine}
            vector-effect="non-scaling-stroke"
          />
          <circle cx={nowX} cy={nowY} r="4" class={style.tideCurveNowDot} />
        </g>
      )}
    </svg>
  );
};

/**
 * One tide line of the mockup: PM/BM, time, height and, for high tides, the
 * coefficient. The cells are laid out by the grid of the surrounding block, so
 * the two lines share their columns and stay aligned under each other.
 */
const TideLine = ({ tide, timezone, language, coefficient }) => {
  if (!tide) {
    return null;
  }
  return (
    <>
      <span class={style.tideLabel}>
        <Text id={`dashboard.boxes.tide.${tide.high ? 'highTideShort' : 'lowTideShort'}`} />
      </span>
      <span class={style.tideTime}>{formatTime(tide.time, timezone)}</span>
      <span class={style.tideHeight}>{formatHeight(tide.height, language)}</span>
      {/* A bare number next to a height reads as another measurement: the
        coefficient says what it is. */}
      {coefficient !== null && coefficient !== undefined && (
        <span
          class={`${style.tideCoefficient} ${
            coefficient >= HIGH_TIDE_COEFFICIENT_THRESHOLD ? style.tideCoefficientHigh : ''
          }`}
        >
          <Text id="dashboard.boxes.tide.coefficientShort" />
          <span class={`ml-1 ${style.tideCoefficientValue}`}>{coefficient}</span>
        </span>
      )}
      {/* The cell is always emitted, so a line with no coefficient still takes
        its column and the two lines keep the same shape. */}
      {(coefficient === null || coefficient === undefined) && <span />}
    </>
  );
};

export { TideClock, TideCurve, TideLine, formatHeight, formatTime, inHouseTimezone, HIGH_TIDE_COEFFICIENT_THRESHOLD };

const TideBox = ({ tideState, loading, error, displayCurve, language, gradientId, dayOffset, onSelectDay }) => {
  const timezone = tideState && tideState.timezone;
  return (
    <div class={`card ${style.tideCard}`}>
      <div class="card-body">
        <div class={`dimmer ${loading ? 'active' : ''}`}>
          <div class="loader" />
          <div class="dimmer-content">
            {error && (
              <p class="alert alert-warning">
                <i class="fe fe-alert-triangle" />
                <span class="pl-2">
                  <Text id={`dashboard.boxes.tide.${error}`} />
                </span>
              </p>
            )}
            {/* Not every place on earth has a tide. Saying why - too far from
              the sea, or a sea that barely moves - is more useful than showing
              an empty widget or a flat curve. */}
            {!error && tideState && tideState.available === false && (
              <p class="alert alert-info mb-0">
                <i class="fe fe-info" />
                <span class="pl-2">
                  {tideState.reason === 'negligible_tide' ? (
                    <Text
                      id="dashboard.boxes.tide.negligibleTide"
                      fields={{ station: tideState.station_name, range: tideState.tide_range }}
                    />
                  ) : (
                    <Text id="dashboard.boxes.tide.noStationNearby" />
                  )}
                </span>
              </p>
            )}
            {!error && tideState && tideState.available && (
              <div>
                <div class={style.tideHeader}>
                  <div class={style.tideClockColumn}>
                    <TideClock tideState={tideState} gradientId={gradientId} />
                  </div>
                  <div class={style.tideHeadline}>
                    <div class={style.tideLines}>
                      <TideLine
                        tide={tideState.next_high_tide}
                        timezone={timezone}
                        language={language}
                        coefficient={tideState.coefficient}
                      />
                      <TideLine tide={tideState.next_low_tide} timezone={timezone} language={language} />
                    </div>
                    <div class={style.tideStation}>
                      <span class={style.tideStationName}>{tideState.station_name}</span>
                    </div>
                  </div>
                </div>
                {displayCurve && (
                  <div class={style.tideCurveSection}>
                    <TideDayTabs
                      dayOffset={dayOffset}
                      onSelectDay={onSelectDay}
                      timezone={timezone}
                      language={language}
                    />
                    <TideCurve tideState={tideState} timezone={timezone} language={language} />
                    <div class={style.tideNow}>
                      <span class="text-muted small">
                        <Text id="dashboard.boxes.tide.currentLevel" />
                      </span>
                      <span class={`ml-2 ${style.tideNowValue}`}>
                        {formatHeight(tideState.current_height, language)}
                      </span>
                      {tideState.rising !== null && (
                        <i
                          class={`fe ${tideState.rising ? 'fe-arrow-up' : 'fe-arrow-down'} ml-1 ${style.tideTrend}`}
                          title={tideState.rising ? 'rising' : 'falling'}
                        />
                      )}
                    </div>
                  </div>
                )}
                {/* CC-BY-4.0 asks for attribution, so the credit stays on the
                  widget even when the curve is hidden. */}
                <div class={`text-muted ${style.tideCredit}`}>
                  <Text
                    id="dashboard.boxes.tide.dataSource"
                    fields={{ source: tideState.station_source || 'Open Waters' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

class Tide extends Component {
  selectDay = async dayOffset => {
    if (dayOffset === this.state.dayOffset) {
      return;
    }
    // The day is picked on the widget itself, not in its settings: it is a way
    // of looking at the tides, not a configuration of the dashboard, so it is
    // kept in the component and never written to the box.
    await this.setState({ dayOffset });
    this.refreshData();
  };

  refreshData = async ({ resetData = false } = {}) => {
    const house = this.props.box.house;
    if (!house) {
      this.setState({ error: 'noHouseSelected', loading: false });
      return;
    }
    this.requestId += 1;
    const requestId = this.requestId;
    try {
      // Keep the tide visible while refreshing, so the loader does not flash
      // over the already rendered widget on every periodic refresh.
      await this.setState(prevState => ({
        error: false,
        tideState: resetData ? undefined : prevState.tideState,
        loading: resetData || !prevState.tideState
      }));
      const tideState = await this.props.httpClient.get(
        `/api/v1/house/${house}/tide?day_offset=${this.state.dayOffset || 0}`
      );
      if (requestId !== this.requestId) {
        return;
      }
      this.setState({ tideState, error: false, loading: false });
    } catch (e) {
      if (requestId !== this.requestId) {
        return;
      }
      const status = e.response && e.response.status;
      this.setState({ error: status === 400 ? 'noCoordinates' : 'error', loading: false });
    }
  };

  componentDidMount() {
    this.refreshData();
    // Wrapped in an arrow function so setInterval does not pass its own argument
    this.interval = setInterval(() => this.refreshData(), REFRESH_INTERVAL_MS);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.box.house !== this.props.box.house) {
      this.refreshData({ resetData: true });
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    // Invalidate any in-flight request so it does not setState after unmount.
    this.requestId += 1;
  }

  constructor(props) {
    super(props);
    this.props = props;
    this.requestId = 0;
    // Unique per instance: two tide widgets on the same dashboard would
    // otherwise share one gradient id, and the second would paint with the
    // first one's definition.
    this.gradientId = `tide-water-${Math.random()
      .toString(36)
      .slice(2)}`;
    this.state = {
      loading: true,
      error: false,
      dayOffset: 0
    };
  }

  render({ box, user }, { tideState, loading, error, dayOffset }) {
    // The curve is shown unless it was explicitly turned off, so the boxes
    // added before this option keep displaying it.
    const displayCurve = box.display_curve !== false;
    return (
      <TideBox
        tideState={tideState}
        loading={loading}
        error={error}
        dayOffset={dayOffset}
        onSelectDay={this.selectDay}
        displayCurve={displayCurve}
        language={user && user.language}
        gradientId={this.gradientId}
      />
    );
  }
}

export default connect('httpClient,user', {})(Tide);
