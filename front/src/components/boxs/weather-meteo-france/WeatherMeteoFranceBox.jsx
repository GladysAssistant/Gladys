import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import dayjs from 'dayjs';

import get from 'get-value';
import actions from '../../../actions/dashboard/boxes/weatherMeteoFrance';
import {
  RequestStatus,
  GetWeatherModes,
  DASHBOARD_BOX_STATUS_KEY,
  DASHBOARD_BOX_DATA_KEY
} from '../../../utils/consts';

// Widget-specific display modes, not part of the shared GetWeatherModes
const CURRENT_WEATHER_MODE = 'currentWeather';
const DATE_LOCATION_MODE = 'dateLocation';
const VIGILANCE_MAP_MODE = 'vigilanceMap';

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

const CHIP_STYLE =
  'flex: 1; display: flex; align-items: center; justify-content: center; background: rgba(70, 127, 207, 0.08); border-radius: 6px; padding: 6px 8px; font-size: 13px';

const VIGILANCE_STYLE = {
  2: { background: '#f7c600', color: '#212529' },
  3: { background: '#f68f00', color: '#fff' },
  4: { background: '#d63939', color: '#fff' }
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
    const vigilanceChanged = prevProps.box.vigilance !== this.props.box.vigilance;
    const mapChanged = get(prevProps, 'box.modes.vigilanceMap') !== get(this.props, 'box.modes.vigilanceMap');
    if (houseChanged || vigilanceChanged || mapChanged) {
      this.refreshData();
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  toggleVigilanceText = () => {
    this.setState({ vigilanceTextExpanded: !this.state.vigilanceTextExpanded });
  };

  render(props) {
    const boxStatus = get(props, `${BOX_STATUS_KEY}.${props.x}_${props.y}`);
    const boxData = get(props, `${BOX_DATA_KEY}.${props.x}_${props.y}`);
    const modes = props.box.modes || {};
    const userLanguage = get(props, 'user.language') || 'fr';

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

    // When a refresh fails but we still have data from a previous call, keep displaying it
    if (!boxData || !boxData.current) {
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
    // In hourly forecast entries, humidity is a raw number (not an object)
    const humidity = typeof current.humidity === 'number' ? Math.round(current.humidity) : null;
    // The Météo-France forecast API returns wind speed in m/s
    const windSpeed = current.wind && current.wind.speed != null ? Math.round(current.wind.speed * 3.6) : null;
    const windDir = current.wind && typeof current.wind.icon === 'string' ? current.wind.icon : null;
    const desc = current.weather ? current.weather.desc : '';
    const alerts = (vigilance && vigilance.alerts) || [];
    const vigilanceEnabled = Boolean(props.box.vigilance);
    // Default to visible for widgets saved before these options existed
    const showCurrentWeather = modes[CURRENT_WEATHER_MODE] !== false;
    const showDateLocation = modes[DATE_LOCATION_MODE] !== false;
    const showChips = modes[GetWeatherModes.AdvancedWeather] && (humidity !== null || windSpeed !== null);
    const showHourly = modes[GetWeatherModes.HourlyForecast] && hourly && hourly.length > 0;
    const showDaily = modes[GetWeatherModes.DailyForecast] && daily && daily.length > 0;
    const showMap = Boolean(modes[VIGILANCE_MAP_MODE]);
    // Section separators are only useful when there is content above them
    const hasContentAboveHourly =
      showDateLocation || showCurrentWeather || showChips || alerts.length > 0 || vigilanceEnabled || showMap;
    const hasContentAboveDaily = hasContentAboveHourly || showHourly;
    const locationName = position && position.name ? position.name : '';

    return (
      <div class="card">
        <div class="card-body" style="padding-top: 12px; padding-bottom: 12px">
          {showDateLocation && (
            <div class="text-muted" style="font-size: 14px; margin-bottom: 8px">
              <span style="text-transform: capitalize">
                {dayjs()
                  .locale(userLanguage)
                  .format('dddd D MMMM')}
              </span>
              {locationName && (
                <span>
                  {' - '}
                  {locationName}
                </span>
              )}
            </div>
          )}

          {/* Current conditions */}
          {showCurrentWeather && (
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px">
              <div style="display: flex; align-items: center; min-width: 0">
                <div style="font-size: 52px; line-height: 1">{currentIcon}</div>
                <div style="font-size: 16px; font-weight: 500; margin-left: 12px">{desc}</div>
              </div>
              <div style="font-size: 36px; font-weight: 600; line-height: 1; white-space: nowrap; margin-left: 8px">
                {temp}
                <span class="text-muted" style="font-size: 20px; font-weight: 400">
                  °C
                </span>
              </div>
            </div>
          )}

          {showChips && (
            <div style="display: flex; gap: 8px; margin-bottom: 12px">
              {humidity !== null && (
                <div style={CHIP_STYLE}>
                  <i class="fe fe-droplet mr-2" style="color: #467fcf" />
                  {humidity}%
                </div>
              )}
              {windSpeed !== null && (
                <div style={CHIP_STYLE}>
                  <i class="fe fe-wind mr-2" style="color: #467fcf" />
                  {windSpeed} km/h
                  {windDir && (
                    <span class="text-muted ml-1" style="font-size: 12px">
                      {windDir}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Vigilance alerts */}
          {alerts.length > 0 && (
            <div style="margin-bottom: 10px">
              {alerts.map(alert => {
                const vstyle = VIGILANCE_STYLE[alert.color] || { background: '#ccc', color: '#333' };
                return (
                  <span
                    key={`${alert.phenomene_id}-${alert.dept}`}
                    style={`background:${vstyle.background};color:${vstyle.color};border-radius:12px;padding:3px 10px;font-size:12px;font-weight:600;display:inline-block;margin-right:5px;margin-bottom:4px`}
                  >
                    {PHENOMENA_EMOJI[alert.phenomene_id] || '⚠️'} {alert.phenomene_nom}
                  </span>
                );
              })}
              {vigilance.text && (
                <div
                  class="text-muted"
                  style={`font-size: 12px; margin-top: 4px; white-space: pre-line; cursor: pointer; ${
                    this.state.vigilanceTextExpanded
                      ? ''
                      : 'display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden'
                  }`}
                  onClick={this.toggleVigilanceText}
                >
                  {vigilance.text}
                </div>
              )}
            </div>
          )}
          {alerts.length === 0 && vigilanceEnabled && (
            <div style="font-size: 12px; color: #2fb344; margin-bottom: 10px">
              <i class="fe fe-check-circle mr-1" />
              <Text id="dashboard.boxes.weatherMeteoFrance.noVigilance" />
            </div>
          )}

          {/* National vigilance map (optional API key) */}
          {showMap &&
            (boxData.vigilanceMapImage ? (
              <img
                src={boxData.vigilanceMapImage}
                alt="Vigilance Météo-France"
                style="width: 100%; border-radius: 6px; margin-bottom: 10px"
              />
            ) : (
              <div class="text-muted" style="font-size: 12px; margin-bottom: 10px">
                <i class="fe fe-alert-circle mr-1" />
                <Text id="dashboard.boxes.weatherMeteoFrance.mapUnavailable" />
              </div>
            ))}

          {/* Hourly forecast */}
          {showHourly && (
            <div
              class={hasContentAboveHourly ? 'border-top' : ''}
              style="display: flex; justify-content: space-between; padding-top: 10px; margin-bottom: 10px"
            >
              {hourly.slice(0, 8).map(hour => (
                <div key={hour.time} style="text-align: center; flex: 1">
                  <div class="text-muted" style="font-size: 10px">
                    {hour.time}h
                  </div>
                  <div style="font-size: 20px; line-height: 1.5">{hour.icon}</div>
                  <div style="font-size: 12px; font-weight: 600">{hour.temp !== null ? `${hour.temp}°` : '--'}</div>
                </div>
              ))}
            </div>
          )}

          {/* Daily forecast */}
          {showDaily && (
            <div
              class={hasContentAboveDaily ? 'border-top' : ''}
              style="display: flex; justify-content: space-between; padding-top: 10px"
            >
              {daily.map(d => (
                <div key={d.dt} style="text-align: center; flex: 1">
                  <div class="text-muted" style="font-size: 14px; text-transform: capitalize; white-space: nowrap">
                    {dayjs
                      .unix(d.dt)
                      .locale(userLanguage)
                      .format('ddd D')}
                  </div>
                  <div style="font-size: 32px; line-height: 1.5">{d.icon}</div>
                  <div style="font-size: 16px; font-weight: 600">{d.max !== null ? `${d.max}°` : '--'}</div>
                  <div class="text-muted" style="font-size: 14px">
                    {d.min !== null ? `${d.min}°` : '--'}
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

export default connect(`${BOX_DATA_KEY},${BOX_STATUS_KEY},user`, actions)(WeatherMeteoFranceBoxComponent);
