import { RequestStatus } from '../../../utils/consts';
import createBoxActions from '../boxActions';
import dayjs from 'dayjs';

const BOX_KEY = 'WeatherMeteoFrance';

const MF_ICONS = {
  1: { j: '☀️', n: '🌙' },
  2: { j: '🌤️', n: '🌤️' },
  3: { j: '🌥️', n: '�️' },
  4: { j: '☁️', n: '☁️' },
  5: { j: '☁️', n: '☁️' },
  6: { j: '🌫️', n: '🌫️' },
  7: { j: '�️', n: '🌫️' },
  8: { j: '🌦️', n: '🌧️' },
  9: { j: '🌧️', n: '🌧️' },
  10: { j: '🌧️', n: '🌧️' },
  11: { j: '🌦️', n: '🌦️' },
  12: { j: '⛈️', n: '⛈️' },
  13: { j: '�️', n: '🌨️' },
  14: { j: '❄️', n: '❄️' },
  15: { j: '❄️', n: '❄️' },
  16: { j: '❄️', n: '❄️' },
  17: { j: '�️', n: '🌩️' },
  18: { j: '⛈️', n: '⛈️' },
  19: { j: '⛈️', n: '⛈️' },
  20: { j: '⛈️', n: '⛈️' },
  21: { j: '⛈️', n: '⛈️' },
};

function getMFIcon(iconCode) {
  const m = iconCode && iconCode.match(/p(\d+)([jn])/);
  if (!m) return '🌡️';
  const entry = MF_ICONS[parseInt(m[1], 10)];
  return entry ? entry[m[2]] : '🌡️';
}

function createActions(store) {
  const boxActions = createBoxActions(store);

  const actions = {
    async getWeatherMeteoFrance(state, box, x, y) {
      boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Getting);
      try {
        if (!box.house) {
          boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Error);
          return;
        }
        const dept = box.dept || '';
        const url = `/api/v1/house/${box.house}/meteofrance/weather${dept ? `?dept=${dept}` : ''}`;
        const data = await state.httpClient.get(url);

        const rawForecast = data.forecast.forecast || [];
        const current = rawForecast.find(h => h.T && h.T.value != null) || rawForecast[0];
        const currentIcon = getMFIcon(current && current.weather ? current.weather.icon : null);

        const hourly = rawForecast.slice(0, 12).map(h => ({
          time: dayjs.unix(h.dt).format('HH'),
          temp: h.T && h.T.value != null ? Math.round(h.T.value) : null,
          icon: getMFIcon(h.weather ? h.weather.icon : null),
          desc: h.weather ? h.weather.desc : '',
        }));

        const daily = (data.forecast.daily_forecast || []).slice(1, 6).map(d => ({
          day: dayjs.unix(d.dt).format('ddd'),
          min: d.T && d.T.min != null ? Math.round(d.T.min) : null,
          max: d.T && d.T.max != null ? Math.round(d.T.max) : null,
          icon: getMFIcon(d.weather12H ? d.weather12H.icon : null),
          desc: d.weather12H ? d.weather12H.desc : '',
        }));

        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          current,
          currentIcon,
          hourly,
          daily,
          position: data.forecast.position || {},
          vigilance: data.vigilance || { alerts: [] },
        });
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Success);
      } catch (e) {
        const msg = e && e.response && e.response.data && e.response.data.message;
        console.error('[WeatherMeteoFrance] error:', msg || e);
        if (msg === 'HOUSE_HAS_NO_COORDINATES') {
          boxActions.updateBoxStatus(state, BOX_KEY, x, y, 'no-coordinates');
        } else if (msg === 'FORECAST_API_ERROR') {
          boxActions.updateBoxStatus(state, BOX_KEY, x, y, 'forecast-api-error');
        } else {
          boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Error);
        }
      }
    },
  };
  return Object.assign({}, actions);
}

export default createActions;
