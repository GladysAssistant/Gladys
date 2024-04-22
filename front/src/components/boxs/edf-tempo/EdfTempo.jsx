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

const PeakState = ({ state }) => (
  <div>
    {state === 'blue' && (
      <span class="badge badge-primary">
        <Text id="dashboard.boxes.edfTempo.blueDay" />
      </span>
    )}
    {state === 'white' && (
      <span class="badge badge-light text-dark">
        <Text id="dashboard.boxes.edfTempo.whiteDay" />
      </span>
    )}
    {state === 'red' && (
      <span class="badge badge-danger">
        <Text id="dashboard.boxes.edfTempo.redDay" />
      </span>
    )}
    {state === 'not-defined' && (
      <span class="badge badge-dark">
        <Text id="dashboard.boxes.edfTempo.notDefinedDay" />
      </span>
    )}
  </div>
);

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
          <p class="alert alert-danger">
            <i class="fe fe-bell" />
            <span class="pl-2">
              <Text id="dashboard.boxes.edfTempo.error" />
            </span>
          </p>
        )}
        {!error && (
          <div class="dimmer-content">
            <div class="row mb-1">
              <div class="col">
                {currentHourPeakState === 'peak-hour' && (
                  <div
                    class={cx(style.hourDisplay, style.peakHour, 'd-flex align-items-center justify-content-center')}
                  >
                    <i class="fe fe-sun mr-4" />
                    <Text id="dashboard.boxes.edfTempo.peakHour" />
                  </div>
                )}
                {currentHourPeakState === 'off-peak-hour' && (
                  <div
                    class={cx(style.hourDisplay, style.offPeakHour, 'd-flex align-items-center justify-content-center')}
                  >
                    <i class="fe fe-moon mr-4" />
                    <Text id="dashboard.boxes.edfTempo.offPeakHour" />
                  </div>
                )}
              </div>
            </div>
            <div class="mt-3">
              <h4 class={style.h4Title}>
                <Text id="dashboard.boxes.edfTempo.dayPeakTitle" />
              </h4>
              <div class="row mb-1">
                <div class="col">{today}</div>
                <div class="col-auto">
                  <PeakState state={todayPeakState} />
                </div>
              </div>
              <div class="row mb-1">
                <div class="col">{tomorrow}</div>
                <div class="col-auto">
                  <PeakState state={tomorrowPeakState} />
                </div>
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
