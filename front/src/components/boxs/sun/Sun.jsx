import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import dayjs from 'dayjs';

import style from './style.css';

const REFRESH_INTERVAL_MS = 60 * 1000;

const CHART_WIDTH = 300;
const CHART_HEIGHT = 90;
const CHART_MARGIN = 8;

const SUN_COLOR = '#fbc02d';
const SUN_STROKE_COLOR = '#f59f00';
const CURVE_COLOR = '#adb5bd';
const HORIZON_COLOR = '#ced4da';
// Solid colors (no transparency): semi-transparent fills would blend with the
// card background and render differently in dark mode despite the double inversion
const DAY_FILL_COLOR = '#fdecc0';
const NIGHT_FILL_COLOR = '#9ca0c5';

const formatTime = time => (time ? dayjs(time).format('HH:mm') : '--:--');

const buildChart = sunState => {
  const curve = sunState.curve || [];
  if (curve.length < 2) {
    return null;
  }
  const startTime = new Date(curve[0].time).getTime();
  const endTime = new Date(curve[curve.length - 1].time).getTime();
  const xFor = time => ((new Date(time).getTime() - startTime) / (endTime - startTime)) * CHART_WIDTH;
  const elevations = curve.map(point => point.elevation);
  // Keep the horizon visible even on days where the sun stays on one side of it
  const maxElevation = Math.max(...elevations, 10);
  const minElevation = Math.min(...elevations, -10);
  const yFor = elevation =>
    CHART_MARGIN + ((maxElevation - elevation) / (maxElevation - minElevation)) * (CHART_HEIGHT - 2 * CHART_MARGIN);

  const curvePath = curve
    .map((point, i) => `${i === 0 ? 'M' : 'L'}${xFor(point.time).toFixed(1)},${yFor(point.elevation).toFixed(1)}`)
    .join(' ');
  const horizonY = yFor(0);
  // Close the curve along the horizon so the fill covers the areas between curve and horizon
  const areaPath = `${curvePath} L${CHART_WIDTH},${horizonY.toFixed(1)} L0,${horizonY.toFixed(1)} Z`;

  const nowX = Math.min(Math.max(xFor(Date.now()), 0), CHART_WIDTH);
  const sunY = yFor(Math.min(Math.max(sunState.elevation, minElevation), maxElevation));

  const sunriseX = sunState.sunrise ? xFor(sunState.sunrise) : null;
  const sunsetX = sunState.sunset ? xFor(sunState.sunset) : null;

  return { curvePath, areaPath, horizonY, nowX, sunY, sunriseX, sunsetX };
};

const SunBox = ({ sunState, chartId, loading, error }) => {
  const chart = sunState && buildChart(sunState);
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
                  <Text id={`dashboard.boxes.sun.${error}`} />
                </span>
              </p>
            )}
            {!error && sunState && (
              <div>
                <div class="d-flex justify-content-between">
                  <div>
                    <div class="text-muted small">
                      <Text id="dashboard.boxes.sun.sunrise" />
                    </div>
                    <div class="h3 mb-0">{formatTime(sunState.sunrise)}</div>
                  </div>
                  <div class="text-right">
                    <div class="text-muted small">
                      <Text id="dashboard.boxes.sun.sunset" />
                    </div>
                    <div class="h3 mb-0">{formatTime(sunState.sunset)}</div>
                  </div>
                </div>
                {chart && (
                  <svg
                    viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                    class={`${style.sunBoxChart} dark-mode-no-invert`}
                  >
                    <defs>
                      <clipPath id={`${chartId}-day`}>
                        <rect x="0" y="0" width={chart.nowX} height={chart.horizonY} />
                      </clipPath>
                      <clipPath id={`${chartId}-night`}>
                        <rect x="0" y={chart.horizonY} width={chart.nowX} height={CHART_HEIGHT - chart.horizonY} />
                      </clipPath>
                    </defs>
                    <path d={chart.areaPath} fill={DAY_FILL_COLOR} clip-path={`url(#${chartId}-day)`} />
                    <path d={chart.areaPath} fill={NIGHT_FILL_COLOR} clip-path={`url(#${chartId}-night)`} />
                    <line x1="0" y1={chart.horizonY} x2={CHART_WIDTH} y2={chart.horizonY} stroke={HORIZON_COLOR} />
                    <path d={chart.curvePath} fill="none" stroke={CURVE_COLOR} stroke-width="1.5" />
                    {chart.sunriseX !== null && (
                      <line
                        x1={chart.sunriseX}
                        y1={chart.horizonY - 8}
                        x2={chart.sunriseX}
                        y2={chart.horizonY + 8}
                        stroke={CURVE_COLOR}
                      />
                    )}
                    {chart.sunsetX !== null && (
                      <line
                        x1={chart.sunsetX}
                        y1={chart.horizonY - 8}
                        x2={chart.sunsetX}
                        y2={chart.horizonY + 8}
                        stroke={CURVE_COLOR}
                      />
                    )}
                    <circle cx={chart.nowX} cy={chart.sunY} r="5" fill={SUN_COLOR} stroke={SUN_STROKE_COLOR} />
                  </svg>
                )}
                <div class="row text-center mt-2">
                  <div class="col-4">
                    <div class="text-muted small">
                      <Text id="dashboard.boxes.sun.dawn" />
                    </div>
                    <div>{formatTime(sunState.dawn)}</div>
                  </div>
                  <div class="col-4">
                    <div class="text-muted small">
                      <Text id="dashboard.boxes.sun.solarNoon" />
                    </div>
                    <div>{formatTime(sunState.solar_noon)}</div>
                  </div>
                  <div class="col-4">
                    <div class="text-muted small">
                      <Text id="dashboard.boxes.sun.dusk" />
                    </div>
                    <div>{formatTime(sunState.dusk)}</div>
                  </div>
                </div>
                <div class="row text-center mt-2">
                  <div class="col-6">
                    <div class="text-muted small">
                      <Text id="dashboard.boxes.sun.azimuth" />
                    </div>
                    <div>{sunState.azimuth}°</div>
                  </div>
                  <div class="col-6">
                    <div class="text-muted small">
                      <Text id="dashboard.boxes.sun.elevation" />
                    </div>
                    <div>{sunState.elevation}°</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

class Sun extends Component {
  refreshData = async () => {
    if (!this.props.box.house) {
      this.setState({ error: 'noHouse', loading: false });
      return;
    }
    try {
      await this.setState({ error: false, loading: true });
      const sunState = await this.props.httpClient.get(`/api/v1/house/${this.props.box.house}/sun`);
      this.setState({ sunState, error: false, loading: false });
    } catch (e) {
      const status = e.response && e.response.status;
      this.setState({ error: status === 400 ? 'noCoordinates' : 'error', loading: false });
    }
  };

  componentDidMount() {
    this.refreshData();
    this.interval = setInterval(this.refreshData, REFRESH_INTERVAL_MS);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.box.house !== this.props.box.house) {
      this.refreshData();
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  constructor(props) {
    super(props);
    this.props = props;
    this.chartId = `sun-chart-${Math.random()
      .toString(36)
      .slice(2)}`;
    this.state = {
      loading: true,
      error: false
    };
  }

  render({}, { sunState, loading, error }) {
    return <SunBox sunState={sunState} chartId={this.chartId} loading={loading} error={error} />;
  }
}

export default connect('httpClient', {})(Sun);
