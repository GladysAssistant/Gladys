import { RequestStatus, GetWeatherStatus } from '../../../utils/consts';
import { ERROR_MESSAGES } from '../../../../../server/utils/constants';
import createBoxActions from '../boxActions';
import dayjs from 'dayjs';
import get from 'get-value';

const BOX_KEY = 'Weather';

const WEATHER_ICONS = {
  snow: 'icon-cloud-snow',
  rain: 'icon-cloud-rain',
  clear: 'icon-sun',
  cloud: 'icon-cloud',
  fog: 'icon-cloud-fog',
  sleet: 'icon-cloud-drizzle',
  wind: 'icon-wind',
  night: 'icon-moon'
};

const translateWeatherToFeIcon = weather => get(WEATHER_ICONS, weather, { default: 'icon-question' });

function createActions(store) {
  const boxActions = createBoxActions(store);

  const actions = {
    async getWeather(state, box, x, y) {
      boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Getting);
      try {
        const weather = await state.httpClient.get(`/api/v1/house/${box.house}/weather`);
        weather.datetime_beautiful = dayjs(weather.datetime)
          .locale(state.user.language)
          .format('D MMM');
        weather.weatherIcon = translateWeatherToFeIcon(weather.weather);

        weather.hours.map(hour => {
          hour.weatherIcon = translateWeatherToFeIcon(hour.weather);
          hour.datetime_beautiful = dayjs(hour.datetime).format('HH');
        });
        weather.days.shift();
        weather.days.map(day => {
          day.weather_icon = translateWeatherToFeIcon(day.weather);
          day.datetime_beautiful = dayjs(day.datetime).format('dddd');
        });

        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          weather
        });
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Success);
      } catch (e) {
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
