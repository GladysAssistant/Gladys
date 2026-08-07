import { RequestStatus, GetWeatherStatus } from '../../../utils/consts';
import { ERROR_MESSAGES } from '../../../../../server/utils/constants';
import createBoxActions from '../boxActions';
import dayjs from 'dayjs';
import get from 'get-value';

const BOX_KEY = 'Weather';

const WEATHER_ICONS = {
  snow: 'fe-cloud-snow',
  rain: 'fe-cloud-rain',
  pouring: 'fe-cloud-rain',
  drizzle: 'fe-cloud-drizzle',
  thunderstorm: 'fe-cloud-lightning',
  clear: 'fe-sun',
  'partly-cloudy': 'fe-cloud',
  cloud: 'fe-cloud',
  fog: 'fe-cloud',
  sleet: 'fe-cloud-drizzle',
  hail: 'fe-cloud-snow',
  wind: 'fe-wind',
  night: 'fe-moon'
};

// is_day is the optional day/night flag of the generic weather format:
// a clear night renders as a moon while the condition stays 'clear'
// ('night' as a condition is deprecated but still rendered)
const translateWeatherToFeIcon = (weather, isDay) => {
  if (weather === 'clear' && isDay === false) {
    return 'fe-moon';
  }
  return get(WEATHER_ICONS, weather, { default: 'fe-question' });
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
        weather.datetime_beautiful = dayjs(weather.datetime)
          .locale(state.user.language)
          .format('D MMM');
        weather.weatherIcon = translateWeatherToFeIcon(weather.weather, weather.is_day);
        // optional fields of the generic weather format: only present when
        // the provider supplies them
        if (weather.sunrise) {
          weather.sunrise_beautiful = dayjs(weather.sunrise).format('HH:mm');
        }
        if (weather.sunset) {
          weather.sunset_beautiful = dayjs(weather.sunset).format('HH:mm');
        }

        if (weather.hours) {
          weather.hours.map(hour => {
            hour.weatherIcon = translateWeatherToFeIcon(hour.weather, hour.is_day);
            hour.datetime_beautiful = dayjs(hour.datetime).format('HH');
          });
        }
        // provider images (vigilance map, rain radar…): metadata comes in
        // the payload, the validated bytes are fetched per key on demand
        if (get(box, 'modes.providerImages') && weather.images && weather.images.length > 0) {
          await Promise.all(
            weather.images.map(async image => {
              try {
                const { image: src } = await state.httpClient.get(
                  `/api/v1/house/${box.house}/weather/image/${image.key}`,
                  providerParams
                );
                image.src = src;
              } catch (imageError) {
                // an unavailable image never breaks the widget: it is skipped
                console.error(imageError);
              }
            })
          );
        }
        if (weather.days) {
          // keep future days only: never assume the provider leads with
          // today (that was an OpenWeather-specific shape)
          weather.days = weather.days.filter(day => dayjs(day.datetime).isAfter(dayjs(), 'day'));
          weather.days.map(day => {
            // the per-day condition is optional in the generic weather
            // format (openweather does not provide it): no icon without it
            day.weatherIcon = day.weather ? translateWeatherToFeIcon(day.weather) : null;
            day.datetime_beautiful = dayjs(day.datetime).format('dddd');
          });
        }

        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          weather
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
    }
  };
  return Object.assign({}, actions);
}

export default createActions;
