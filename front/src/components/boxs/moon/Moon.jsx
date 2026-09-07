import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezonePlugin from 'dayjs/plugin/timezone';

import moonPhoto from './moon.png';
import style from './style.css';

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const REFRESH_INTERVAL_MS = 60 * 1000;

// The moon is drawn in a 100x100 viewBox, so the disk radius is 50
const DISK_RADIUS = 50;
const DISK_CENTER = 50;

const SHADOW_COLOR = '#11131c';
// The shadow is kept translucent so the relief of the unlit part still shows
// through, the way earthshine lights it up on a real moon, while the phase
// stays readable at a glance on both the light and the dark theme.
const SHADOW_OPACITY = 0.7;

/**
 * Read a date in the timezone the values were computed in. The browser may sit
 * in another one: without this, a dashboard opened from abroad would shift
 * moonrise by the difference and count the days off the wrong midnight.
 */
const inHouseTimezone = (date, timezone) => (timezone ? dayjs(date).tz(timezone) : dayjs(date));

const formatTime = (time, timezone) => (time ? inHouseTimezone(time, timezone).format('HH:mm') : '--:--');

/**
 * Build the SVG path of the shadow covering the unlit part of the disk.
 * The terminator is seen as a half-ellipse: its horizontal radius shrinks to
 * zero at the quarters, when the terminator is a straight line.
 */
const buildShadowPath = (phase, waxing) => {
  // Illuminated fraction along the equator: 0 at the new moon, 1 at the full
  // moon. The shadow covers the rest of the disk.
  const illuminatedFraction = (1 - Math.cos(2 * Math.PI * phase)) / 2;
  // Signed half-width of the terminator ellipse. It is positive while the
  // shadow is larger than half the disk (the terminator then bulges towards
  // the lit side), and negative once the moon is past the quarter.
  const terminatorRadius = DISK_RADIUS * (1 - 2 * illuminatedFraction);

  const top = DISK_CENTER - DISK_RADIUS;
  const bottom = DISK_CENTER + DISK_RADIUS;
  // The moon lights up from its eastern limb: while waxing the shadow sits on
  // the western side of the disk, while waning on the eastern side.
  const limbSweep = waxing ? 0 : 1;
  // While the shadow covers more than half the disk the terminator bulges
  // into the lit half, so the arc is swept like the limb. Past the quarter it
  // curves back the other way.
  const terminatorSweep = terminatorRadius >= 0 ? limbSweep : 1 - limbSweep;

  return [
    `M ${DISK_CENTER} ${top}`,
    // Outer limb of the shadowed side
    `A ${DISK_RADIUS} ${DISK_RADIUS} 0 0 ${limbSweep} ${DISK_CENTER} ${bottom}`,
    // Terminator back to the top
    `A ${Math.abs(terminatorRadius).toFixed(2)} ${DISK_RADIUS} 0 0 ${terminatorSweep} ${DISK_CENTER} ${top}`,
    'Z'
  ].join(' ');
};

const MoonDisk = ({ moonState, maskId }) => {
  // The shadow is kept vertical, like on a lunar calendar: the terminator is
  // drawn on the west limb while waxing and on the east limb while waning.
  // The real moon is tilted by its position in the sky, but that orientation
  // changes hour by hour and makes the disk look upside down at times.
  const shadowPath = buildShadowPath(moonState.phase, moonState.waxing);
  return (
    <svg viewBox="0 0 100 100" class={`${style.moonDisk} dark-mode-no-invert`}>
      <defs>
        <clipPath id={maskId}>
          <circle cx={DISK_CENTER} cy={DISK_CENTER} r={DISK_RADIUS} />
        </clipPath>
      </defs>
      <g clip-path={`url(#${maskId})`}>
        <image href={moonPhoto} x="0" y="0" width="100" height="100" />
        <path d={shadowPath} fill={SHADOW_COLOR} opacity={SHADOW_OPACITY} />
      </g>
    </svg>
  );
};

/** Small-caps heading separating the two groups of details. */
const MoonSectionTitle = ({ labelKey }) => (
  <div class={`text-muted ${style.moonSectionTitle}`}>
    <Text id={`dashboard.boxes.moon.${labelKey}`} />
  </div>
);

/**
 * One instantaneous state of the moon: the label sits above its value, so the
 * cells stay compact instead of spreading label and value apart.
 */
const MoonState = ({ labelKey, children }) => (
  <div class={style.moonStateCell}>
    <div class="text-muted small">
      <Text id={`dashboard.boxes.moon.${labelKey}`} />
    </div>
    <div class={style.moonValue}>{children}</div>
  </div>
);

/**
 * Format a date as a number of days from now, like "in 5 days".
 * Calendar days are counted from midnight to midnight in the timezone of the
 * house, not as a number of elapsed hours: an event tomorrow morning has to
 * read "in 1 day" all day long, and stay in step with the absolute date shown
 * next to it. Counting hours would make it drop to "today" late in the
 * evening, and counting them off the browser midnight would shift the whole
 * list by a day for a dashboard opened from another timezone.
 */
const RelativeDays = ({ date, timezone }) => {
  if (!date) {
    return <Text id="dashboard.boxes.moon.unknown" />;
  }
  const days = inHouseTimezone(date, timezone)
    .startOf('day')
    .diff(inHouseTimezone(new Date(), timezone).startOf('day'), 'day');
  if (days <= 0) {
    return <Text id="dashboard.boxes.moon.today" />;
  }
  return <Text id="dashboard.boxes.moon.inDays" plural={days} fields={{ count: days }} />;
};

/**
 * One upcoming event. The absolute date is shown next to the countdown, so it
 * can be read off a calendar without counting the days by hand.
 */
const MoonEvent = ({ labelKey, date, language, timezone }) => (
  <div class="d-flex justify-content-between align-items-baseline py-1">
    <span class="text-muted small mr-2">
      <Text id={`dashboard.boxes.moon.${labelKey}`} />
    </span>
    <span class={`text-right ${style.moonEventValue}`}>
      <span class={style.moonValue}>
        <RelativeDays date={date} timezone={timezone} />
      </span>
      {date && (
        <span class="text-muted small ml-2">
          {inHouseTimezone(date, timezone)
            .locale(language)
            .format('ddd D MMM')}
        </span>
      )}
    </span>
  </div>
);

const MoonBox = ({ moonState, maskId, loading, error, displayDetails, language }) => {
  // The timezone the server computed the values in
  const timezone = moonState && moonState.timezone;
  return (
    <div class="card">
      <div class="card-body">
        <div class={`dimmer ${loading ? 'active' : ''}`}>
          <div class="loader" />
          <div class="dimmer-content">
            {error && (
              <p class="alert alert-warning">
                <i class="fe fe-alert-triangle" />
                <span class="pl-2">
                  <Text id={`dashboard.boxes.moon.${error}`} />
                </span>
              </p>
            )}
            {!error && moonState && (
              <div>
                <div class={style.moonHeader}>
                  <div class={style.moonDiskColumn}>
                    <MoonDisk moonState={moonState} maskId={maskId} />
                  </div>
                  <div class={style.moonHeadline}>
                    <div class={`h3 mb-0 ${style.moonPhaseName}`}>
                      <Text id={`dashboard.boxes.moon.phases.${moonState.phase_name}`} />
                    </div>
                    <div class="text-muted small">
                      <Text id="dashboard.boxes.moon.illuminationValue" fields={{ percent: moonState.illumination }} />
                      {' · '}
                      {/* The second decimal of the age is noise at this precision */}
                      <Text id="dashboard.boxes.moon.ageValue" fields={{ days: moonState.age_days.toFixed(1) }} />
                    </div>
                    {/* Same layout as the sunrise/sunset of the sun box, so both
                      widgets read as a family on the dashboard. */}
                    <div class={`d-flex ${style.moonRiseSet}`}>
                      <div>
                        <div class="text-muted small">
                          <Text id="dashboard.boxes.moon.moonrise" />
                        </div>
                        <div class={`h3 mb-0 ${style.moonValue}`}>{formatTime(moonState.moonrise, timezone)}</div>
                      </div>
                      <div>
                        <div class="text-muted small">
                          <Text id="dashboard.boxes.moon.moonset" />
                        </div>
                        <div class={`h3 mb-0 ${style.moonValue}`}>{formatTime(moonState.moonset, timezone)}</div>
                      </div>
                    </div>
                  </div>
                </div>
                {displayDetails && (
                  <div>
                    <div class={style.moonSection}>
                      <MoonSectionTitle labelKey="todaySection" />
                      <div class={style.moonStateGrid}>
                        <MoonState labelKey="distance">
                          {moonState.distance.toLocaleString()} <Text id="dashboard.boxes.moon.kilometers" />
                        </MoonState>
                        <MoonState labelKey="trajectory">
                          <Text id={`dashboard.boxes.moon.${moonState.ascending ? 'ascending' : 'descending'}`} />
                        </MoonState>
                        <MoonState labelKey="zodiac">
                          <Text id={`dashboard.boxes.moon.zodiacSigns.${moonState.zodiac_sign}`} />
                        </MoonState>
                        {/* Which node comes next is carried by the label, so the
                          value stays a plain countdown like the other events. */}
                        <MoonState labelKey={moonState.next_node_ascending ? 'nextNodeNorth' : 'nextNodeSouth'}>
                          <RelativeDays date={moonState.next_node} timezone={timezone} />
                        </MoonState>
                      </div>
                    </div>
                    <div class={style.moonSection}>
                      <MoonSectionTitle labelKey="upcomingSection" />
                      <MoonEvent
                        labelKey="fullMoon"
                        date={moonState.next_full_moon}
                        language={language}
                        timezone={timezone}
                      />
                      <MoonEvent
                        labelKey="newMoon"
                        date={moonState.next_new_moon}
                        language={language}
                        timezone={timezone}
                      />
                      <MoonEvent
                        labelKey="perigee"
                        date={moonState.next_perigee}
                        language={language}
                        timezone={timezone}
                      />
                      <MoonEvent
                        labelKey="apogee"
                        date={moonState.next_apogee}
                        language={language}
                        timezone={timezone}
                      />
                      <MoonEvent
                        labelKey={
                          moonState.next_eclipse ? `eclipseLabel.${moonState.next_eclipse_type}` : 'nextEclipse'
                        }
                        date={moonState.next_eclipse}
                        language={language}
                        timezone={timezone}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

class Moon extends Component {
  refreshData = async ({ resetData = false } = {}) => {
    // Only the latest request is allowed to update the state: a slow response
    // must not overwrite the data of a house selected afterwards.
    this.requestId += 1;
    const { requestId } = this;
    const house = this.props.box.house;
    if (!house) {
      this.setState({ error: 'noHouse', loading: false, moonState: undefined });
      return;
    }
    try {
      // Keep the moon visible while refreshing, so the loader does not flash
      // over the already rendered disk on every periodic refresh.
      await this.setState(prevState => ({
        error: false,
        moonState: resetData ? undefined : prevState.moonState,
        loading: resetData || !prevState.moonState
      }));
      // Lunar calendars publish their values at local midnight: the widget can
      // be aligned with them so both can be compared line by line.
      const query = this.props.box.compute_at_midnight ? '?at_midnight=true' : '';
      const moonState = await this.props.httpClient.get(`/api/v1/house/${house}/moon${query}`);
      if (requestId !== this.requestId) {
        return;
      }
      this.setState({ moonState, error: false, loading: false });
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
    } else if (prevProps.box.compute_at_midnight !== this.props.box.compute_at_midnight) {
      // The values are computed server-side, so the new ones have to be fetched
      this.refreshData();
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
    this.maskId = `moon-disk-${Math.random()
      .toString(36)
      .slice(2)}`;
    this.state = {
      loading: true,
      error: false
    };
  }

  render({ box, user }, { moonState, loading, error }) {
    // Details are shown unless they were explicitly turned off, so the boxes
    // added before this option keep displaying them.
    const displayDetails = box.display_details !== false;
    return (
      <MoonBox
        moonState={moonState}
        maskId={this.maskId}
        loading={loading}
        error={error}
        displayDetails={displayDetails}
        language={user && user.language}
      />
    );
  }
}

export default connect('httpClient,user', {})(Moon);
