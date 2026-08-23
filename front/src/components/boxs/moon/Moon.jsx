import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import dayjs from 'dayjs';

import moonPhoto from './moon.png';
import style from './style.css';

const REFRESH_INTERVAL_MS = 60 * 1000;

// The moon is drawn in a 100x100 viewBox, so the disk radius is 50
const DISK_RADIUS = 50;
const DISK_CENTER = 50;

const SHADOW_COLOR = '#11131c';
// The shadow is kept translucent so the relief of the unlit part still shows
// through, the way earthshine lights it up on a real moon, while the phase
// stays readable at a glance on both the light and the dark theme.
const SHADOW_OPACITY = 0.7;

const formatTime = time => (time ? dayjs(time).format('HH:mm') : '--:--');

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

const MoonRow = ({ labelKey, children }) => (
  <div class="d-flex justify-content-between align-items-baseline py-1">
    <span class="text-muted small mr-2">
      <Text id={`dashboard.boxes.moon.${labelKey}`} />
    </span>
    <span class={`text-right ${style.moonRowValue}`}>{children}</span>
  </div>
);

/**
 * Format a date as a number of days from now, like "in 5 days".
 * Events are days or weeks away, so a day granularity is what matters here.
 */
const RelativeDays = ({ date }) => {
  if (!date) {
    return <Text id="dashboard.boxes.moon.unknown" />;
  }
  const days = dayjs(date).diff(dayjs(), 'day');
  if (days <= 0) {
    return <Text id="dashboard.boxes.moon.today" />;
  }
  return <Text id="dashboard.boxes.moon.inDays" plural={days} fields={{ count: days }} />;
};

const MoonBox = ({ moonState, maskId, loading, error, displayDetails }) => (
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
            <div class={style.moonLayout}>
              <div class={style.moonDiskColumn}>
                <MoonDisk moonState={moonState} maskId={maskId} />
                <div class={`text-center mt-2 ${style.moonPhaseName}`}>
                  <Text id={`dashboard.boxes.moon.phases.${moonState.phase_name}`} />
                </div>
                <div class="text-center text-muted small">{moonState.illumination} %</div>
              </div>
              {displayDetails && (
                <div class={style.moonDetails}>
                  <MoonRow labelKey="distance">
                    {moonState.distance.toLocaleString()} <Text id="dashboard.boxes.moon.kilometers" />
                  </MoonRow>
                  <MoonRow labelKey="age">
                    <Text id="dashboard.boxes.moon.ageValue" fields={{ days: moonState.age_days }} />
                  </MoonRow>
                  <MoonRow labelKey="phase">
                    <Text id={`dashboard.boxes.moon.${moonState.waxing ? 'waxing' : 'waning'}`} />
                  </MoonRow>
                  <MoonRow labelKey="trajectory">
                    <Text id={`dashboard.boxes.moon.${moonState.ascending ? 'ascending' : 'descending'}`} />
                  </MoonRow>
                  <MoonRow labelKey="zodiac">
                    <Text id={`dashboard.boxes.moon.zodiacSigns.${moonState.zodiac_sign}`} />
                  </MoonRow>
                  <MoonRow labelKey="moonrise">{formatTime(moonState.moonrise)}</MoonRow>
                  <MoonRow labelKey="moonset">{formatTime(moonState.moonset)}</MoonRow>
                  <MoonRow labelKey="nextFullMoon">
                    <RelativeDays date={moonState.next_full_moon} />
                  </MoonRow>
                  <MoonRow labelKey="nextNewMoon">
                    <RelativeDays date={moonState.next_new_moon} />
                  </MoonRow>
                  <MoonRow labelKey="nextPerigee">
                    <RelativeDays date={moonState.next_perigee} />
                  </MoonRow>
                  <MoonRow labelKey="nextApogee">
                    <RelativeDays date={moonState.next_apogee} />
                  </MoonRow>
                  <MoonRow labelKey="nextNode">
                    <RelativeDays date={moonState.next_node} />
                    <span class="text-muted small ml-1">
                      (
                      <Text id={`dashboard.boxes.moon.${moonState.next_node_ascending ? 'nodeNorth' : 'nodeSouth'}`} />)
                    </span>
                  </MoonRow>
                  <MoonRow labelKey="nextEclipse">
                    {moonState.next_eclipse ? (
                      <span>
                        <RelativeDays date={moonState.next_eclipse} />
                        <span class="text-muted small ml-1">
                          (
                          <Text id={`dashboard.boxes.moon.eclipse.${moonState.next_eclipse_type}`} />)
                        </span>
                      </span>
                    ) : (
                      <Text id="dashboard.boxes.moon.unknown" />
                    )}
                  </MoonRow>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

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

  render({ box }, { moonState, loading, error }) {
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
      />
    );
  }
}

export default connect('httpClient', {})(Moon);
