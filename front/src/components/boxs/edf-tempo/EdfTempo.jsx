import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import cx from 'classnames';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import style from './style.css';

dayjs.extend(utc);
dayjs.extend(timezone);

// Refresh EDF Tempo data every 1 hour
const BOX_REFRESH_INTERVAL_MS = 1 * 60 * 60 * 1000;

// The Tempo color IS the information: a tinted pill with a color dot, from
// the same family as the theme's stamps (soft background, saturated ink)
const PEAK_STATE_STYLE_KEYS = {
  blue: 'dayBlue',
  white: 'dayWhite',
  red: 'dayRed',
  'not-defined': 'dayUnknown'
};

const PEAK_STATE_LABEL_KEYS = {
  blue: 'blueDay',
  white: 'whiteDay',
  red: 'redDay',
  'not-defined': 'notDefinedDay'
};

const PeakState = ({ state }) =>
  PEAK_STATE_STYLE_KEYS[state] ? (
    // dark-mode-no-invert: a Tempo day is named by its color, and the white
    // day's lightness IS its hue — inversion would turn it into a black pill.
    // The double inversion keeps the literal blue/white/red, like the stamps.
    <span class={cx(style.dayBadge, 'dark-mode-no-invert', style[PEAK_STATE_STYLE_KEYS[state]])}>
      <span class={style.dayDot} />
      <Text id={`dashboard.boxes.edfTempo.${PEAK_STATE_LABEL_KEYS[state]}`} />
    </span>
  ) : null;

const EdfTempoBox = ({ loading, error, today, tomorrow, currentHourPeakState, todayPeakState, tomorrowPeakState }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <i class="fe fe-zap" />
        <span class="m-1">
          <Text id="dashboard.boxTitle.edf-tempo" />
        </span>
      </h3>
    </div>
    <div class="card-body">
      <div class={`dimmer ${loading ? 'active' : ''}`}>
        <div class="loader" />
        {error && (
          <div class={style.errorState}>
            <i class="fe fe-bell" />
            <span>
              <Text id="dashboard.boxes.edfTempo.error" />
            </span>
          </div>
        )}
        {!error && (
          <div class="dimmer-content">
            {/* current tariff window: sun = peak (amber), moon = off-peak (indigo) */}
            {currentHourPeakState === 'peak-hour' && (
              <div class={cx(style.hourPill, style.hourPeak)}>
                <span class={style.hourIcon}>
                  <i class="fe fe-sun" />
                </span>
                <Text id="dashboard.boxes.edfTempo.peakHour" />
              </div>
            )}
            {currentHourPeakState === 'off-peak-hour' && (
              <div class={cx(style.hourPill, style.hourOffPeak)}>
                <span class={style.hourIcon}>
                  <i class="fe fe-moon" />
                </span>
                <Text id="dashboard.boxes.edfTempo.offPeakHour" />
              </div>
            )}
            <div class="mt-3">
              <h4 class={style.h4Title}>
                <Text id="dashboard.boxes.edfTempo.dayPeakTitle" />
              </h4>
              <div class={style.dayRow}>
                <span class={style.dayName}>{today}</span>
                <PeakState state={todayPeakState} />
              </div>
              <div class={style.dayRow}>
                <span class={style.dayName}>{tomorrow}</span>
                <PeakState state={tomorrowPeakState} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

class EdfTempo extends Component {
  refreshData = async () => {
    try {
      await this.setState({ error: false, loading: true });
      const edfTempoData = await this.props.httpClient.get('/api/v1/service/edf-tempo/state');
      const today = dayjs()
        .locale(this.props.user.language)
        .format('ddd LL');
      const tomorrow = dayjs()
        .add(1, 'day')
        .locale(this.props.user.language)
        .format('ddd LL');

      const todayPeakState = edfTempoData.today_peak_state;
      const tomorrowPeakState = edfTempoData.tomorrow_peak_state;

      this.setState({
        error: false,
        loading: false,
        today,
        tomorrow,
        todayPeakState,
        tomorrowPeakState
      });
    } catch (e) {
      this.setState({ error: true, loading: false });
    }
  };

  refreshPeakHourState = () => {
    const today = dayjs();
    const todayHour = today.tz('Europe/Paris').hour();
    const currentHourPeakState = todayHour >= 6 && todayHour < 22 ? 'peak-hour' : 'off-peak-hour';
    this.setState({ currentHourPeakState });
  };

  componentDidMount() {
    this.refreshPeakHourState();
    this.refreshData();
    this.interval = setInterval(() => this.refreshData(), BOX_REFRESH_INTERVAL_MS);
    // Every minute, refresh peak hour state
    this.peakHourRefreshInterval = setInterval(() => this.refreshPeakHourState(), 60 * 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    clearInterval(this.peakHourRefreshInterval);
  }

  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      loading: true,
      error: false
    };
  }

  render({}, { loading, error, today, tomorrow, currentHourPeakState, todayPeakState, tomorrowPeakState }) {
    return (
      <EdfTempoBox
        loading={loading}
        error={error}
        today={today}
        tomorrow={tomorrow}
        currentHourPeakState={currentHourPeakState}
        todayPeakState={todayPeakState}
        tomorrowPeakState={tomorrowPeakState}
      />
    );
  }
}

export default connect('httpClient,user', {})(EdfTempo);
