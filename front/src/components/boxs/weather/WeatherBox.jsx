import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import { Link } from 'preact-router/match';
import get from 'get-value';

import { WEATHER_UNITS } from '../../../../../server/utils/constants';

import actions from '../../../actions/dashboard/boxes/weather';
import {
  RequestStatus,
  GetWeatherModes,
  GetWeatherStatus,
  DEFAULT_ON_WEATHER_MODES,
  DASHBOARD_BOX_STATUS_KEY,
  DASHBOARD_BOX_DATA_KEY
} from '../../../utils/consts';

const BOX_KEY = 'Weather';
const BOX_DATA_KEY = `${DASHBOARD_BOX_DATA_KEY}${BOX_KEY}`;

/**
 * Weather icon of a condition. `icon` is what the action layer resolved: the
 * URL of a bundled SVG for every real condition, or an emoji for the ones
 * with no drawing of their own (currently 'unknown'). Sizing stays with the
 * caller, which is why the size is passed in and applied to both shapes.
 *
 * An emoji is told from an image by its PREFIX, not by a '.svg' suffix: Vite
 * inlines any asset under 4 kB as a `data:image/svg+xml,...` URI, which has no
 * extension at all and rendered as raw text when the test looked for one.
 *
 * `label` is the localized condition name: it becomes the image `alt` and the
 * emoji `aria-label`, so a screen reader announces the weather instead of
 * skipping a decorative image.
 *
 * The emoji branch keeps .weather-real-colors — it needs the pre-darkened
 * counter-inversion the class applies in dark mode. The image branch must NOT
 * have it: a CSS filter creates a stacking context, so a filtered parent
 * composites its children through its own filter and the two would stack.
 */
const WeatherIcon = ({ icon, size, label }) => {
  if (!icon) {
    return null;
  }
  const isImage =
    typeof icon === 'string' && (icon.startsWith('data:') || icon.startsWith('/') || icon.includes('.svg'));
  if (!isImage) {
    return (
      <span
        class="weather-real-colors"
        role="img"
        aria-label={label || undefined}
        style={`font-size: ${size}px; line-height: 1`}
      >
        {icon}
      </span>
    );
  }
  // `size` is a CEILING, not a fixed width: the icon shrinks with its column so
  // eight hourly cells still fit a phone-width card or a one-column wall
  // tablet, and never grows past the size the layout was designed around.
  return (
    <img
      src={icon}
      alt={label || ''}
      class="weather-condition-icon"
      style={`width: 100%; max-width: ${size}px; height: auto; display: block; margin: 0 auto`}
    />
  );
};
const BOX_STATUS_KEY = `${DASHBOARD_BOX_STATUS_KEY}${BOX_KEY}`;
const BOX_REFRESH_INTERVAL_MS = 30 * 60 * 1000;

// CAP-style severities of the generic weather format, mapped to the
// vigilance color language (minor = blue, moderate = yellow,
// severe = orange, extreme = red)
const ALERT_SEVERITY_STYLE = {
  minor: { background: '#45aaf2', color: '#fff' },
  moderate: { background: '#f7c600', color: '#212529' },
  severe: { background: '#f68f00', color: '#fff' },
  extreme: { background: '#d63939', color: '#fff' }
};

// Emoji per generic alert phenomenon type; untyped alerts keep the
// generic warning triangle
const ALERT_TYPE_EMOJIS = {
  wind: '💨',
  rain: '🌧️',
  flood: '🌊',
  thunderstorm: '⛈️',
  snow: '❄️',
  heat: '🥵',
  cold: '🥶',
  avalanche: '🏔️',
  coastal: '🌊',
  fog: '🌫️'
};

const MOON_EMOJIS = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];

// Official UV index scale colors (green, yellow, orange, red, violet)
function getUvColor(uv) {
  if (uv >= 11) {
    return '#8557e0';
  }
  if (uv >= 8) {
    return '#d63939';
  }
  if (uv >= 6) {
    return '#f68f00';
  }
  if (uv >= 3) {
    return '#d4a900';
  }
  return '#2fb344';
}

// Moon phase index (0 = new moon, 4 = full moon) from the synodic month,
// using the new moon of January 6th 2000 18:14 UTC as reference
function getMoonPhaseIndex() {
  const synodicMonth = 29.53058867;
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14) / 86400000;
  const daysSince = Date.now() / 86400000 - knownNewMoon;
  const age = ((daysSince % synodicMonth) + synodicMonth) % synodicMonth;
  return Math.round(age / (synodicMonth / 8)) % 8;
}

const ErrorCard = ({ messageId, children }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <i class="fe fe-cloud" />
        <span class="m-1">
          <Text id="dashboard.boxTitle.weather" />
        </span>
      </h3>
    </div>
    <div class="card-body">
      <p class="alert alert-danger mb-0">
        <i class="fe fe-bell" />
        <span class="pl-2">
          <Text id={messageId} />
          {children}
        </span>
      </p>
    </div>
  </div>
);

class WeatherBoxComponent extends Component {
  refreshData = () => {
    this.props.getWeather(this.props.box, this.props.x, this.props.y);
  };

  // full alert bulletins fold to 3 lines, one click swaps folded/expanded
  toggleAlertDescription = alertKey => {
    const expandedAlerts = this.state.expandedAlerts || {};
    this.setState({
      expandedAlerts: { ...expandedAlerts, [alertKey]: !expandedAlerts[alertKey] }
    });
  };

  componentDidMount() {
    this.refreshData();
    this.interval = setInterval(this.refreshData, BOX_REFRESH_INTERVAL_MS);
  }

  componentDidUpdate(previousProps) {
    const houseChanged = get(previousProps, 'box.house') !== get(this.props, 'box.house');
    const providerChanged = get(previousProps, 'box.provider') !== get(this.props, 'box.provider');
    // only the modes changing what the widget fetches trigger a refresh;
    // the purely cosmetic ones re-render from the data already in the store
    const providerImagesChanged =
      get(previousProps, 'box.modes.providerImages') !== get(this.props, 'box.modes.providerImages');
    if (houseChanged || providerChanged || providerImagesChanged) {
      this.refreshData();
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render(props) {
    const boxStatus = get(props, `${BOX_STATUS_KEY}.${props.x}_${props.y}`);
    const weather = get(props, `${BOX_DATA_KEY}.${props.x}_${props.y}.weather`);
    const modes = props.box.modes || {};
    const userLanguage = get(props, 'user.language') || 'en';

    if (boxStatus === GetWeatherStatus.HouseHasNoCoordinates) {
      return <ErrorCard messageId="dashboard.boxes.weather.houseHasNoCoordinates" />;
    }
    if (boxStatus === GetWeatherStatus.ServiceNotConfigured) {
      return <ErrorCard messageId="dashboard.boxes.weather.serviceNotConfigured" />;
    }
    if (boxStatus === GetWeatherStatus.RequestToThirdPartyFailed) {
      return (
        <ErrorCard messageId="dashboard.boxes.weather.requestToThirdPartyFailed">
          {' '}
          <Link href="/dashboard/integration/environment">
            <Text id="dashboard.boxes.weather.clickHere" />
          </Link>
        </ErrorCard>
      );
    }
    // when a refresh fails but a previous response is still in the store,
    // keep displaying it rather than replacing the widget with an error
    if (boxStatus === RequestStatus.Error && !weather) {
      return <ErrorCard messageId="dashboard.boxes.weather.unknownError" />;
    }
    if (!weather) {
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

    // the pivot format carries its own unit system: temperatures and wind are
    // already in the requested system, the widget only picks the matching
    // labels — precipitation is the exception, always in mm (see formatRain)
    const isMetric = weather.units === WEATHER_UNITS.METRIC;
    const tempUnit = isMetric ? '°C' : '°F';
    const windUnit = isMetric ? 'km/h' : 'mph';
    // metric wind speed comes in m/s, imperial already in mph
    // `fromGust` marks a value the provider only gave as a gust: prefixed with
    // `~` so a peak is not read as the average wind speed
    const formatWind = (speed, fromGust) =>
      `${fromGust ? '~' : ''}${Math.round(isMetric ? speed * 3.6 : speed)} ${windUnit}`;
    // precipitation is always in mm in the pivot, whatever `units` says: the
    // server stamps the unit system but never converts the amounts
    const formatRain = amount =>
      isMetric ? `${Math.round(amount * 10) / 10} mm` : `${Math.round((amount / 25.4) * 100) / 100} in`;

    const temperature = Math.round(weather.temperature);
    const humidity = typeof weather.humidity === 'number' ? Math.round(weather.humidity) : null;
    const pressure = typeof weather.pressure === 'number' ? Math.round(weather.pressure) : null;
    const windSpeed = typeof weather.wind_speed === 'number' ? weather.wind_speed : null;
    const uvIndex = typeof weather.uv_index === 'number' ? weather.uv_index : null;
    // rain of the current slot: the pivot carries no precipitation at the
    // root, so it is lifted from the running hourly entry by the actions
    const rainAmount = typeof weather.current_precipitation === 'number' ? weather.current_precipitation : null;
    const rainProbability =
      typeof weather.current_precipitation_probability === 'number'
        ? Math.round(weather.current_precipitation_probability)
        : null;
    const alerts = weather.alerts || [];
    const images = weather.images || [];
    const hours = weather.hours || [];
    const days = weather.days || [];
    const moonPhase = getMoonPhaseIndex();
    const expandedAlerts = this.state.expandedAlerts || {};

    // a rain row is only drawn when at least one entry carries an amount:
    // most providers give none, and an empty line before the wind is noise
    const hasHourlyRain = hours.some(hour => typeof hour.precipitation === 'number');
    const hasHourlyWind = hours.some(hour => typeof hour.wind_speed === 'number');
    const hasDailyRain = days.some(day => typeof day.precipitation === 'number');
    const hasDailyWind = days.some(day => typeof day.wind_speed === 'number');

    // default to visible for widgets saved before these options existed
    const isModeOn = mode => (DEFAULT_ON_WEATHER_MODES.includes(mode) ? modes[mode] !== false : Boolean(modes[mode]));
    const showDateLocation = isModeOn(GetWeatherModes.DateLocation);
    const showCurrentWeather = isModeOn(GetWeatherModes.CurrentWeather);
    const shownAlerts = isModeOn(GetWeatherModes.Alerts) ? alerts : [];
    // a merged alert carries every distinct bulletin text of its phenomenon,
    // and several phenomena of a same area often share one bulletin (Météo
    // France sends the whole department bulletin as every alert description),
    // so each text is printed once across the whole widget
    const seenDescriptions = new Set();
    const alertDescriptions = [];
    shownAlerts.forEach(alert => {
      const descriptions = alert.descriptions || (alert.description ? [alert.description] : []);
      descriptions.forEach((description, index) => {
        if (seenDescriptions.has(description)) {
          return;
        }
        seenDescriptions.add(description);
        alertDescriptions.push({
          alertKey: `${alert.severity}-${alert.event}-${alert.start || ''}-${index}`,
          description
        });
      });
    });
    const showChips =
      isModeOn(GetWeatherModes.AdvancedWeather) &&
      (humidity !== null ||
        pressure !== null ||
        windSpeed !== null ||
        uvIndex !== null ||
        rainAmount !== null ||
        rainProbability !== null ||
        weather.sunrise_beautiful ||
        weather.sunset_beautiful);
    const showHourly = isModeOn(GetWeatherModes.HourlyForecast) && hours.length > 0;
    const showDaily = isModeOn(GetWeatherModes.DailyForecast) && days.length > 0;
    const shownImages = isModeOn(GetWeatherModes.ProviderImages) ? images.filter(image => image.src) : [];

    // section separators are only useful when there is content above them
    const hasContentAboveHourly =
      showDateLocation || showCurrentWeather || showChips || shownAlerts.length > 0 || shownImages.length > 0;
    const hasContentAboveDaily = hasContentAboveHourly || showHourly;

    return (
      <div class="card">
        <div class="card-body" style="padding-top: 12px; padding-bottom: 12px">
          {showDateLocation && (
            <div
              class="text-muted"
              style="font-size: 14px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: baseline"
            >
              <span style="text-transform: capitalize; min-width: 0">{weather.datetime_beautiful}</span>
              {get(weather, 'house.name') && (
                <span style="margin-left: 8px; white-space: nowrap">{weather.house.name}</span>
              )}
            </div>
          )}

          {/* Current conditions */}
          {showCurrentWeather && (
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px">
              <div style="display: flex; align-items: center; min-width: 0">
                <div style="line-height: 1">
                  <Localizer>
                    <WeatherIcon
                      icon={weather.weatherEmoji}
                      size={64}
                      label={<Text id={`dashboard.boxes.weather.conditions.${weather.weather || 'unknown'}`} />}
                    />
                  </Localizer>
                </div>
                <div style="font-size: 16px; font-weight: 500; margin-left: 12px">
                  {/* same fallback as the emoji mapping: a provider omitting
                  the condition still gets a label instead of a blank line */}
                  <Text id={`dashboard.boxes.weather.conditions.${weather.weather || 'unknown'}`} />
                </div>
              </div>
              <div style="font-size: 36px; font-weight: 600; line-height: 1; white-space: nowrap; margin-left: 8px">
                {temperature}
                <span class="text-muted" style="font-size: 20px; font-weight: 400">
                  {tempUnit}
                </span>
              </div>
            </div>
          )}

          {/* Weather details */}
          {showChips && (
            <div style="background: rgba(70, 127, 207, 0.08); border-radius: 6px; padding: 8px 12px; margin-bottom: 12px; font-size: 13px; line-height: 1.9">
              <div style="display: flex; justify-content: space-between">
                <div>
                  {humidity !== null && (
                    <div>
                      <i class="fe fe-droplet mr-2" style="color: #467fcf" />
                      {humidity}
                      <Text id="global.percent" />
                    </div>
                  )}
                  {pressure !== null && (
                    <div>
                      <i class="fe fe-activity mr-2" style="color: #467fcf" />
                      {pressure} hPa
                    </div>
                  )}
                  {weather.sunrise_beautiful && (
                    <div>
                      <i class="fe fe-sunrise mr-2 weather-real-colors" style="color: #f59f00" />
                      {weather.sunrise_beautiful}
                    </div>
                  )}
                </div>
                <div style="text-align: right">
                  {windSpeed !== null && (
                    <div>
                      {formatWind(windSpeed)}
                      {weather.wind_cardinal && (
                        <span>
                          {' '}
                          <Text id={`dashboard.boxes.weather.windCardinals.${weather.wind_cardinal}`} />
                        </span>
                      )}
                      <i class="fe fe-wind ml-2" style="color: #467fcf" />
                    </div>
                  )}
                  {(rainAmount !== null || rainProbability !== null) && (
                    <div>
                      {rainAmount !== null && <span>{formatRain(rainAmount)}</span>}
                      {rainAmount !== null && rainProbability !== null && <span class="text-muted mx-1">|</span>}
                      {rainProbability !== null && (
                        <span>
                          {rainProbability}
                          <Text id="global.percent" />
                        </span>
                      )}
                      <i class="fe fe-umbrella ml-2" style="color: #467fcf" />
                    </div>
                  )}
                  {weather.sunset_beautiful && (
                    <div>
                      {weather.sunset_beautiful}
                      <i class="fe fe-sunset ml-2 weather-real-colors" style="color: #f59f00" />
                    </div>
                  )}
                </div>
              </div>
              <div style="display: flex; justify-content: space-between">
                <div>
                  <span class="mr-2 weather-real-colors">{MOON_EMOJIS[moonPhase]}</span>
                  <Text id={`dashboard.boxes.weather.moonPhases.${moonPhase}`} />
                </div>
                {uvIndex !== null && (
                  <div>
                    <Text id="dashboard.boxes.weather.uv" />{' '}
                    <span class="weather-real-colors" style={`font-weight: 600; color: ${getUvColor(uvIndex)}`}>
                      {uvIndex}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Weather alerts */}
          {shownAlerts.length > 0 && (
            <div style="margin-bottom: 10px">
              {shownAlerts.map(alert => {
                const style = ALERT_SEVERITY_STYLE[alert.severity] || { background: '#ccc', color: '#333' };
                return (
                  <span
                    key={`${alert.severity}-${alert.event}-${alert.start || ''}`}
                    class="weather-real-colors"
                    style={`background:${style.background};color:${style.color};border-radius:12px;padding:3px 10px;font-size:12px;font-weight:600;display:inline-block;margin-right:5px;margin-bottom:4px`}
                    title={alert.description || alert.event}
                  >
                    {(alert.type && ALERT_TYPE_EMOJIS[alert.type]) || '⚠️'}{' '}
                    {/* typed alerts get a translated label, the provider's
                    free-text event stays the fallback */}
                    {alert.type ? (
                      <Text id={`dashboard.boxes.weather.alertTypes.${alert.type}`}>{alert.event}</Text>
                    ) : (
                      alert.event
                    )}
                  </span>
                );
              })}
              {alertDescriptions.map(({ alertKey, description }) => {
                const expanded = expandedAlerts[alertKey];
                return (
                  <div
                    key={`description-${alertKey}`}
                    class="text-muted"
                    role="button"
                    tabIndex="0"
                    aria-expanded={Boolean(expanded)}
                    onClick={() => this.toggleAlertDescription(alertKey)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.toggleAlertDescription(alertKey);
                      }
                    }}
                    style={`font-size: 12px; margin-top: 4px; white-space: pre-line; cursor: pointer; ${
                      expanded
                        ? ''
                        : 'display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden'
                    }`}
                  >
                    {description}
                  </div>
                );
              })}
            </div>
          )}

          {/* Provider images (vigilance map, rain radar…) */}
          {shownImages.map(image => {
            const imageLabel =
              image.label && (image.label[userLanguage] || image.label.en || Object.values(image.label)[0]);
            return (
              <div key={image.key} style="margin-bottom: 10px">
                {imageLabel && (
                  <div class="text-muted" style="font-size: 12px; margin-bottom: 4px">
                    {imageLabel}
                  </div>
                )}
                <img
                  src={image.src}
                  alt={imageLabel || image.key}
                  class="weather-provider-image"
                  style="width: 100%; border-radius: 6px"
                />
              </div>
            );
          })}

          {/* Hourly forecast */}
          {showHourly && (
            <div
              class={hasContentAboveHourly ? 'border-top' : ''}
              style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 10px; margin-bottom: 10px"
            >
              {hours.map((hour, index) => (
                <div key={hour.datetime} style="text-align: center; flex: 1">
                  {/* the first column is the current time slot: emphasize it */}
                  <div
                    class={index === 0 ? '' : 'text-muted'}
                    style={`font-size: ${index === 0 ? '12px' : '10px'}; font-weight: ${
                      index === 0 ? '600' : '400'
                    }; margin-bottom: 3px`}
                  >
                    {hour.datetime_beautiful}h
                  </div>
                  <div style="line-height: 1.5; margin-bottom: 3px; display: flex; justify-content: center">
                    <Localizer>
                      <WeatherIcon
                        icon={hour.weatherEmoji}
                        size={index === 0 ? 40 : 32}
                        label={<Text id={`dashboard.boxes.weather.conditions.${hour.weather || 'unknown'}`} />}
                      />
                    </Localizer>
                  </div>
                  <div style={`font-size: ${index === 0 ? '15px' : '12px'}; font-weight: 600; margin-bottom: 4px`}>
                    {Math.round(hour.temperature)}°
                  </div>
                  {hasHourlyRain && (
                    <div class="text-muted" style="font-size: 10px; white-space: nowrap; margin-bottom: 3px">
                      {typeof hour.precipitation === 'number' ? formatRain(hour.precipitation) : ' '}
                    </div>
                  )}
                  {hasHourlyWind && (
                    <div class="text-muted" style="font-size: 10px; white-space: nowrap">
                      {typeof hour.wind_speed === 'number' ? formatWind(hour.wind_speed) : ' '}
                    </div>
                  )}
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
              {days.map(day => (
                <div key={day.datetime} style="text-align: center; flex: 1">
                  <div
                    class="text-muted"
                    style="font-size: 14px; text-transform: capitalize; white-space: nowrap; margin-bottom: 3px"
                  >
                    {day.datetime_beautiful}
                  </div>
                  {day.weatherEmoji && (
                    <div style="line-height: 1.5; margin-bottom: 3px; display: flex; justify-content: center">
                      <Localizer>
                        <WeatherIcon
                          icon={day.weatherEmoji}
                          size={44}
                          label={<Text id={`dashboard.boxes.weather.conditions.${day.weather || 'unknown'}`} />}
                        />
                      </Localizer>
                    </div>
                  )}
                  <div style="font-size: 16px; font-weight: 600; margin-bottom: 4px">
                    {Math.round(day.temperature_max)}°
                  </div>
                  <div class="text-muted" style="font-size: 14px; margin-bottom: 4px">
                    {Math.round(day.temperature_min)}°
                  </div>
                  {hasDailyRain && (
                    <div class="text-muted" style="font-size: 11px; white-space: nowrap; margin-bottom: 3px">
                      {typeof day.precipitation === 'number' ? formatRain(day.precipitation) : ' '}
                    </div>
                  )}
                  {hasDailyWind && (
                    // the `~` of a gust-only value is not self-explanatory:
                    // the tooltip spells it out without widening the column
                    <Localizer>
                      <div
                        class="text-muted"
                        style="font-size: 11px; white-space: nowrap"
                        title={
                          day.wind_speed_from_gust ? <Text id="dashboard.boxes.weather.windGustTitle" /> : undefined
                        }
                      >
                        {typeof day.wind_speed === 'number'
                          ? formatWind(day.wind_speed, day.wind_speed_from_gust)
                          : ' '}
                      </div>
                    </Localizer>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default connect(`${BOX_DATA_KEY},${BOX_STATUS_KEY},user`, actions)(WeatherBoxComponent);
