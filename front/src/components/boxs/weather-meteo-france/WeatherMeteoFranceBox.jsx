import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';

import get from 'get-value';
import actions from '../../../actions/dashboard/boxes/weatherMeteoFrance';
import { RequestStatus, GetWeatherModes, DASHBOARD_BOX_STATUS_KEY, DASHBOARD_BOX_DATA_KEY } from '../../../utils/consts';

const BOX_KEY = 'WeatherMeteoFrance';
const BOX_DATA_KEY = `${DASHBOARD_BOX_DATA_KEY}${BOX_KEY}`;
const BOX_STATUS_KEY = `${DASHBOARD_BOX_STATUS_KEY}${BOX_KEY}`;
const BOX_REFRESH_INTERVAL_MS = 30 * 60 * 1000;

const PHENOMENA_EMOJI = {
  1: '💨',
  2: '🌧️',
  3: '⛈️',
  4: '🌊',
  5: '❄️',
  6: '🥵',
  7: '🥶',
  8: '🏔️',
  9: '🌊'
};

const VIGILANCE_STYLE = {
  2: { background: '#f1c40f', color: '#333' },
  3: { background: '#e67e22', color: '#fff' },
  4: { background: '#c0392b', color: '#fff' }
};

class WeatherMeteoFranceBoxComponent extends Component {
  refreshData = () => {
    this.props.getWeatherMeteoFrance(this.props.box, this.props.x, this.props.y);
  };

  componentDidMount() {
    this.refreshData();
    this.interval = setInterval(this.refreshData, BOX_REFRESH_INTERVAL_MS);
  }

  componentDidUpdate(prevProps) {
    const houseChanged = prevProps.box.house !== this.props.box.house;
    const deptChanged = prevProps.box.dept !== this.props.box.dept;
    if (houseChanged || deptChanged) {
      this.refreshData();
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render(props) {
    const boxStatus = get(props, `${BOX_STATUS_KEY}.${props.x}_${props.y}`);
    const boxData = get(props, `${BOX_DATA_KEY}.${props.x}_${props.y}`);
    const modes = props.box.modes || {};

    if (!props.box.house) {
      return (
        <div class="card">
          <div class="card-body text-center text-muted">
            <Text id="dashboard.boxes.weatherMeteoFrance.noHouseConfigured" />
          </div>
        </div>
      );
    }

    if ((!boxStatus || boxStatus === RequestStatus.Getting) && !boxData) {
      return (
        <div class="card">
          <div class="card-body">
            <div class="dimmer active">
              <div class="loader" />
              <div class="dimmer-content" style="min-height: 60px" />
            </div>
          </div>
        </div>
      );
    }

    if (boxStatus === 'no-coordinates') {
      return (
        <div class="card">
          <div class="card-body">
            <p class="alert alert-warning mb-0">
              <i class="fe fe-map-pin mr-2" />
              <Text id="dashboard.boxes.weatherMeteoFrance.noCoordinates" />
            </p>
          </div>
        </div>
      );
    }

    if (boxStatus === 'forecast-api-error' || boxStatus === RequestStatus.Error || !boxData || !boxData.current) {
      return (
        <div class="card">
          <div class="card-body">
            <p class="alert alert-danger mb-0">
              <i class="fe fe-cloud-off mr-2" />
              <Text id="dashboard.boxes.weatherMeteoFrance.error" />
            </p>
          </div>
        </div>
      );
    }

    const { current, currentIcon, hourly, daily, position, vigilance } = boxData;
    const temp = current.T && current.T.value != null ? Math.round(current.T.value) : '--';
    const humidity = current.humidity ? current.humidity.value : null;
    const windSpeed = current.wind ? Math.round(current.wind.speed) : null;
    const desc = current.weather ? current.weather.desc : '';
    const alerts = (vigilance && vigilance.alerts) || [];
    const locationName = position && position.name ? position.name : '';

    return (
      <div class="card">
        <div
          class="card-body"
          style="padding: 12px 14px"
        >
          {locationName && (
            <div style="font-size: 11px; color: #888; margin-bottom: 6px">
              📍 {locationName}
            </div>
          )}

          {/* Current conditions */}
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px">
            <div style="font-size: 42px; line-height: 1">{currentIcon}</div>
            <div style="text-align: right">
              <div style="font-size: 28px; font-weight: bold; line-height: 1">{temp}°C</div>
              <div style="font-size: 11px; color: #666; margin-top: 2px">{desc}</div>
              {(humidity !== null || windSpeed !== null) && (
                <div style="font-size: 11px; color: #888; margin-top: 2px">
                  {humidity !== null && <span>💧{humidity}% </span>}
                  {windSpeed !== null && <span>💨{windSpeed} km/h</span>}
                </div>
              )}
            </div>
          </div>

          {/* Vigilance alerts */}
          {alerts.length > 0 && (
            <div style="margin-bottom: 8px">
              {alerts.map(alert => {
                const vstyle = VIGILANCE_STYLE[alert.color] || { background: '#ccc', color: '#333' };
                return (
                  <span
                    key={`${alert.phenomene_id}-${alert.dept}`}
                    style={`background:${vstyle.background};color:${vstyle.color};border-radius:4px;padding:2px 6px;font-size:11px;font-weight:bold;display:inline-block;margin-right:4px;margin-bottom:3px`}
                  >
                    {PHENOMENA_EMOJI[alert.phenomene_id] || '⚠️'} {alert.phenomene_nom}
                  </span>
                );
              })}
            </div>
          )}

          {/* Hourly forecast */}
          {modes[GetWeatherModes.HourlyForecast] && hourly && hourly.length > 0 && (
            <div
              style="display:flex;overflow-x:auto;gap:6px;padding-top:8px;border-top:1px solid #eee;margin-bottom:8px"
            >
              {hourly.map(hour => (
                <div key={hour.time} style="text-align:center;flex-shrink:0;min-width:34px">
                  <div style="font-size:10px;color:#888">{hour.time}h</div>
                  <div style="font-size:18px;line-height:1.3">{hour.icon}</div>
                  <div style="font-size:11px;font-weight:bold">
                    {hour.temp !== null ? `${hour.temp}°` : '--'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Daily forecast */}
          {modes[GetWeatherModes.DailyForecast] && daily && daily.length > 0 && (
            <div style="border-top:1px solid #eee;padding-top:8px">
              {daily.map(d => (
                <div
                  key={d.day}
                  style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px"
                >
                  <div style="font-size:12px;width:32px;text-transform:capitalize">{d.day}</div>
                  <div style="font-size:18px">{d.icon}</div>
                  <div style="font-size:12px;text-align:right;white-space:nowrap">
                    <span style="font-weight:bold;color:#e67e22">
                      {d.max !== null ? `${d.max}°` : '--'}
                    </span>
                    <span style="color:#aaa">
                      {' / '}{d.min !== null ? `${d.min}°` : '--'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default connect(
  `${BOX_DATA_KEY},${BOX_STATUS_KEY}`,
  actions
)(WeatherMeteoFranceBoxComponent);
