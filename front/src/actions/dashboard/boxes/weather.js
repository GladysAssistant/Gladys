import { RequestStatus, GetWeatherStatus } from '../../../utils/consts';
import { ERROR_MESSAGES } from '../../../../../server/utils/constants';
import createBoxActions from '../boxActions';
import dayjs from 'dayjs';
import get from 'get-value';

const BOX_KEY = 'Weather';

const translateWeatherToFeIcon = weather => {
  if (weather.search('snow') !== -1) {
    return 'fe-cloud-snow';
  }
  if (weather.search('rain') !== -1) {
    return 'fe-cloud-rain';
  }
  if (weather.search('clear') !== -1) {
    return 'fe-sun';
  }
  if (weather.search('cloud') !== -1) {
    return 'fe-cloud';
  }
  if (weather.search('fog') !== -1) {
    return 'fe-cloud';
  }
  if (weather.search('sleet') !== -1) {
    return 'fe-cloud-drizzle';
  }
  if (weather.search('wind') !== -1) {
    return 'fe-wind';
  }
  if (weather.search('night') !== -1) {
    return 'fe-moon';
  }
  return 'fe-question';
};

const createActions = store => {
  const boxActions = createBoxActions(store);

  const actions = {
    async getWeather(state, box, x, y) {
      boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Getting);
      try {
        const weather = await state.httpClient.get(`/api/v1/house/${box.house}/weather`);
        const displayMode = await state.httpClient.get('/api/v1/service/darksky/variable/DARKSKY_DISPLAY_MODE');
        weather.options.display = displayMode.value;
        weather.datetime_beautiful = dayjs(weather.datetime)
          .locale(state.user.language)
          .format('dddd DD MMMM');
        weather.temperature = weather.temperature.toFixed(2);
        weather.weather = translateWeatherToFeIcon(weather.weather);
        if (weather.options.display === 'advanced') {
          weather.hours.map(day => {
            day.weather = translateWeatherToFeIcon(day.weather);
          });
        }
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
};

export default createActions;
