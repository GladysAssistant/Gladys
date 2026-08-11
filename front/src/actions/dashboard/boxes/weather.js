import { RequestStatus, GetWeatherStatus } from '../../../utils/consts';
import { ERROR_MESSAGES } from '../../../../../server/utils/constants';
import createBoxActions from '../boxActions';
import dayjs from 'dayjs';
import get from 'get-value';

const BOX_KEY = 'Weather';

// Emoji per generic condition of the pivot weather format, in a day and a
// night variant. The night variant is picked from the optional is_day flag,
// so a clear night renders as a moon while the condition stays 'clear'.
const WEATHER_EMOJIS = {
  clear: { day: '☀️', night: '🌙' },
  'partly-cloudy': { day: '🌤️', night: '☁️' },
  cloud: { day: '☁️', night: '☁️' },
  fog: { day: '🌫️', night: '🌫️' },
  drizzle: { day: '🌦️', night: '🌦️' },
  rain: { day: '🌧️', night: '🌧️' },
  pouring: { day: '🌧️', night: '🌧️' },
  sleet: { day: '🌨️', night: '🌨️' },
  hail: { day: '🌨️', night: '🌨️' },
  snow: { day: '❄️', night: '❄️' },
  thunderstorm: { day: '⛈️', night: '⛈️' },
  wind: { day: '💨', night: '💨' },
  // 'night' is deprecated as a condition but still rendered
  night: { day: '🌙', night: '🌙' },
  unknown: { day: '🌡️', night: '🌡️' },
};

/**
 * Emoji of a generic weather condition.
 * isDay is the optional day/night flag of the pivot format: only an explicit
 * false switches to the night variant, an absent flag stays on the day one.
 */
const translateWeatherToEmoji = (weather, isDay) => {
  const entry = WEATHER_EMOJIS[weather] || WEATHER_EMOJIS.unknown;
  return isDay === false ? entry.night : entry.day;
};

// Wind direction in degrees to a localized cardinal key (N, NE, E, SE, S, SW, W, NW)
const WIND_CARDINALS = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

const degreesToCardinal = (degrees) => {
  if (degrees === undefined || degrees === null || Number.isNaN(Number(degrees))) {
    return null;
  }
  return WIND_CARDINALS[Math.round((((Number(degrees) % 360) + 360) % 360) / 45) % 8];
};

// CAP severities from the least to the most serious, to keep the worst one
// when several bulletins of the same phenomenon are merged
const ALERT_SEVERITY_ORDER = ['minor', 'moderate', 'severe', 'extreme'];

const severityRank = (severity) => {
  const rank = ALERT_SEVERITY_ORDER.indexOf(severity);
  return rank === -1 ? 0 : rank;
};

/**
 * Whether an alert is still running.
 * `end` is optional in the generic weather format: an alert without one has no
 * known expiry and is kept — dropping it would hide the Météo France alerts,
 * which carry no end date on most bulletins. An unparsable date is kept too:
 * hiding a real alert over a malformed field is the worse failure.
 */
const isAlertOngoing = (alert) => {
  if (!alert.end) {
    return true;
  }
  const end = dayjs(alert.end);
  return !end.isValid() || end.isAfter(dayjs());
};

/**
 * Collapse the alerts of a same phenomenon into a single one.
 * Providers relaying raw CAP bulletins (OpenWeather does) emit one alert per
 * phenomenon AND per validity window, so a two-day heat wave arrives as two
 * identical 'heat' entries. Expired bulletins are dropped first — the same
 * providers keep serving them after their end date — then the rest are merged
 * on their type (or on their event label when the provider sends no type),
 * keeping the worst severity and the widest time range.
 * Descriptions are accumulated instead of collapsed: two bulletins of a same
 * phenomenon may carry different safety instructions, and keeping only the
 * first would silently drop the others. `description` stays the first one, for
 * the badge tooltip; `descriptions` holds every distinct text, for the widget.
 */
const normalizeAlerts = (alerts) => {
  const byPhenomenon = new Map();
  alerts.filter(isAlertOngoing).forEach((alert) => {
    const key = alert.type || alert.event;
    const previous = byPhenomenon.get(key);
    if (!previous) {
      byPhenomenon.set(key, { ...alert, descriptions: alert.description ? [alert.description] : [] });
      return;
    }
    // the merged alert carries the worst severity, so its badge keeps the
    // color of the most serious bulletin of the phenomenon
    if (severityRank(alert.severity) > severityRank(previous.severity)) {
      previous.severity = alert.severity;
      previous.event = alert.event;
    }
    if (alert.start && (!previous.start || alert.start < previous.start)) {
      previous.start = alert.start;
    }
    if (alert.end && (!previous.end || alert.end > previous.end)) {
      previous.end = alert.end;
    }
    if (!previous.description && alert.description) {
      previous.description = alert.description;
    }
    if (alert.description && !previous.descriptions.includes(alert.description)) {
      previous.descriptions.push(alert.description);
    }
  });
  return Array.from(byPhenomenon.values());
};

function createActions(store) {
  const boxActions = createBoxActions(store);

  const actions = {
    async getWeather(state, box, x, y) {
      boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Getting);
      try {
        // a provider pinned in the widget configuration travels as
        // ?service= — absent, the server picks the first available one
        const providerParams = box.provider ? { service: box.provider } : undefined;
        const weather = await state.httpClient.get(`/api/v1/house/${box.house}/weather`, providerParams);
        weather.datetime_beautiful = dayjs(weather.datetime).locale(state.user.language).format('dddd D MMMM');
        weather.weatherEmoji = translateWeatherToEmoji(weather.weather, weather.is_day);
        // optional fields of the generic weather format: only present when
        // the provider supplies them
        if (weather.sunrise) {
          weather.sunrise_beautiful = dayjs(weather.sunrise).format('HH:mm');
        }
        if (weather.sunset) {
          weather.sunset_beautiful = dayjs(weather.sunset).format('HH:mm');
        }
        weather.wind_cardinal = degreesToCardinal(weather.wind_direction);

        if (weather.hours) {
          // rain of the current conditions: read before the hourly list is
          // trimmed to its 8 columns, and from the slot that covers now
          // rather than hours[0] — the trim drops the running hour, so
          // hours[0] is already the *next* slot
          const currentSlot =
            weather.hours.filter((hour) => !dayjs(hour.datetime).isAfter(dayjs())).pop() || weather.hours[0];
          if (currentSlot) {
            if (typeof currentSlot.precipitation === 'number') {
              weather.current_precipitation = currentSlot.precipitation;
            }
            if (typeof currentSlot.precipitation_probability === 'number') {
              weather.current_precipitation_probability = currentSlot.precipitation_probability;
            }
          }
          // keep the coming hours only: a provider may lead with past
          // entries of the current day
          const now = dayjs().subtract(30, 'minute');
          weather.hours = weather.hours.filter((hour) => dayjs(hour.datetime).isAfter(now));
          // cover the next 24 hours in 8 columns, so one entry every 3 hours:
          // the skip is derived from the provider's own step, entries already
          // spaced by 3 hours or more are kept as-is
          if (weather.hours.length > 1) {
            const stepMinutes = dayjs(weather.hours[1].datetime).diff(dayjs(weather.hours[0].datetime), 'minute');
            const columnSkip = stepMinutes > 0 ? Math.max(1, Math.round(180 / stepMinutes)) : 1;
            weather.hours = weather.hours.filter((hour, index) => index % columnSkip === 0);
          }
          weather.hours = weather.hours.slice(0, 8);
          weather.hours.forEach((hour) => {
            hour.weatherEmoji = translateWeatherToEmoji(hour.weather, hour.is_day);
            hour.datetime_beautiful = dayjs(hour.datetime).format('HH');
          });
        }
        // provider images (vigilance map, rain radar…): metadata comes in
        // the payload, the validated bytes are fetched per key on demand
        if (get(box, 'modes.providerImages') && weather.images && weather.images.length > 0) {
          await Promise.all(
            weather.images.map(async (image) => {
              try {
                const { image: src } = await state.httpClient.get(
                  `/api/v1/house/${box.house}/weather/image/${image.key}`,
                  providerParams,
                );
                image.src = src;
              } catch (imageError) {
                // an unavailable image never breaks the widget: it is skipped
                console.error(imageError);
              }
            }),
          );
        }
        if (weather.alerts) {
          weather.alerts = normalizeAlerts(weather.alerts);
        }
        if (weather.days) {
          // keep future days only: never assume the provider leads with
          // today (that was an OpenWeather-specific shape)
          weather.days = weather.days.filter((day) => dayjs(day.datetime).isAfter(dayjs(), 'day'));
          weather.days = weather.days.slice(0, 5);
          weather.days.forEach((day) => {
            // the per-day condition is optional in the generic weather
            // format (openweather does not provide it): no emoji without it
            day.weatherEmoji = day.weather ? translateWeatherToEmoji(day.weather) : null;
            // daily wind: aggregating it from the hourly entries is not an
            // option — the pivot caps `hours` at 24 entries (a single day),
            // so only the first day could ever be filled. The row is shown
            // only when the provider fills wind_speed on every day itself.
            // gusts are peaks, not an average: the value is flagged so the
            // widget can mark it with a `~` instead of passing a peak off as
            // the day's wind speed
            if (typeof day.wind_speed !== 'number' && typeof day.wind_gust === 'number') {
              day.wind_speed = day.wind_gust;
              day.wind_speed_from_gust = true;
            }
            day.datetime_beautiful = dayjs(day.datetime).locale(state.user.language).format('ddd D');
          });
        }

        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          weather,
        });
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Success);
      } catch (e) {
        console.error(e);
        const responseMessage = get(e, 'response.data.message');
        if (responseMessage === ERROR_MESSAGES.HOUSE_HAS_NO_COORDINATES) {
          boxActions.updateBoxStatus(state, BOX_KEY, x, y, GetWeatherStatus.HouseHasNoCoordinates);
        } else if (responseMessage === ERROR_MESSAGES.SERVICE_NOT_CONFIGURED) {
          boxActions.updateBoxStatus(state, BOX_KEY, x, y, GetWeatherStatus.ServiceNotConfigured);
        } else if (responseMessage === ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED) {
          boxActions.updateBoxStatus(state, BOX_KEY, x, y, GetWeatherStatus.RequestToThirdPartyFailed);
        } else {
          boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Error);
        }
      }
    },
  };
  return Object.assign({}, actions);
}

export default createActions;
