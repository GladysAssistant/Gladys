import { RequestStatus } from '../../../utils/consts';
import createBoxActions from '../boxActions';
import dayjs from 'dayjs';

const BOX_KEY = 'WeatherMeteoFrance';

const MF_ICONS = {
  1: { j: '☀️', n: '🌙' },
  2: { j: '🌤️', n: '🌤️' },
  3: { j: '🌥️', n: '☁️' },
  4: { j: '🌥️', n: '☁️' },
  5: { j: '☁️', n: '☁️' },
  6: { j: '🌫️', n: '🌫️' },
  7: { j: '🌫️', n: '🌫️' },
  8: { j: '🌦️', n: '🌧️' },
  9: { j: '🌧️', n: '🌧️' },
  10: { j: '🌧️', n: '🌧️' },
  11: { j: '🌦️', n: '🌦️' },
  12: { j: '⛈️', n: '⛈️' },
  13: { j: '🌨️', n: '🌨️' },
  14: { j: '❄️', n: '❄️' },
  15: { j: '❄️', n: '❄️' },
  16: { j: '❄️', n: '❄️' },
  17: { j: '🌩️', n: '🌩️' },
  18: { j: '⛈️', n: '⛈️' },
  19: { j: '⛈️', n: '⛈️' },
  20: { j: '⛈️', n: '⛈️' },
  21: { j: '⛈️', n: '⛈️' }
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
        const url = `/api/v1/house/${box.house}/meteofrance/weather${box.vigilance ? '?vigilance=true' : ''}`;
        const data = await state.httpClient.get(url);

        // The API returns the full current day, including past hours: keep future entries only
        const nowTs = Math.floor(Date.now() / 1000);
        const rawForecast = data.forecast.forecast || [];
        const upcoming = rawForecast.filter(h => h.dt >= nowTs - 1800);
        const current = upcoming.find(h => h.T && h.T.value != null) || upcoming[0] || rawForecast[0];
        const currentIcon = getMFIcon(current && current.weather ? current.weather.icon : null);

        // Anchor the hourly strip on the same entry as the current conditions,
        // so the emphasized first column matches the displayed current weather
        const hourlySource = upcoming.slice(Math.max(0, upcoming.indexOf(current)));

        // Cover the next 24 hours in 8 columns (one entry every 3 hours)
        const hourly = hourlySource
          .filter(h => h.dt <= hourlySource[0].dt + 24 * 3600)
          .filter((h, index) => index % 3 === 0)
          .slice(0, 8)
          .map(h => {
            // Rain amount key depends on the forecast step (1h first, then 3h)
            let rain = null;
            if (h.rain && h.rain['1h'] != null) {
              rain = h.rain['1h'];
            } else if (h.rain && h.rain['3h'] != null) {
              rain = h.rain['3h'];
            }
            return {
              time: dayjs.unix(h.dt).format('HH'),
              temp: h.T && h.T.value != null ? h.T.value : null,
              icon: getMFIcon(h.weather ? h.weather.icon : null),
              desc: h.weather ? h.weather.desc : '',
              rain: rain !== null ? Math.round(rain * 10) / 10 : null
            };
          });

        const daily = (data.forecast.daily_forecast || []).slice(1, 6).map(d => {
          let weather = d.weather12H;
          if (!weather || !weather.icon) {
            // weather12H can be null on some days: fall back to the hourly forecast closest to midday
            const midday = d.dt + 12 * 3600;
            const sameDay = rawForecast.filter(
              h => h.dt >= d.dt && h.dt < d.dt + 24 * 3600 && h.weather && h.weather.icon
            );
            weather = sameDay.reduce(
              (best, h) => (!best || Math.abs(h.dt - midday) < Math.abs(best.dt - midday) ? h : best),
              null
            );
            weather = weather && weather.weather;
          }
          // The 24h total can be missing on some days: sum the hourly rain amounts instead
          let rain = d.precipitation && d.precipitation['24h'] != null ? d.precipitation['24h'] : null;
          if (rain === null) {
            let hourlyRainSum = 0;
            let hourlyRainFound = false;
            rawForecast.forEach(h => {
              if (h.dt >= d.dt && h.dt < d.dt + 24 * 3600 && h.rain) {
                let value = null;
                if (h.rain['1h'] != null) {
                  value = h.rain['1h'];
                } else if (h.rain['3h'] != null) {
                  value = h.rain['3h'];
                } else if (h.rain['6h'] != null) {
                  value = h.rain['6h'];
                }
                if (value !== null) {
                  hourlyRainSum += value;
                  hourlyRainFound = true;
                }
              }
            });
            if (hourlyRainFound) {
              rain = hourlyRainSum;
            }
          }
          return {
            dt: d.dt,
            min: d.T && d.T.min != null ? d.T.min : null,
            max: d.T && d.T.max != null ? d.T.max : null,
            icon: getMFIcon(weather ? weather.icon : null),
            desc: weather ? weather.desc : '',
            rain: rain !== null ? Math.round(rain * 10) / 10 : null
          };
        });

        // Today's sunrise/sunset and UV index come from the first daily entry
        const today = (data.forecast.daily_forecast || [])[0];
        const sun = today && today.sun && today.sun.rise ? { rise: today.sun.rise, set: today.sun.set } : null;
        const uv = today && today.uv != null ? today.uv : null;

        // Rain probability for the current slot (3h entries, or 6h when only that window exists)
        const probabilities = data.forecast.probability_forecast || [];
        const currentProba = probabilities.find(p => {
          if (!p.rain || (p.rain['3h'] == null && p.rain['6h'] == null)) {
            return false;
          }
          const slotDuration = p.rain['3h'] != null ? 3 * 3600 : 6 * 3600;
          return p.dt + slotDuration > nowTs;
        });
        let rainChance = null;
        if (currentProba) {
          rainChance = currentProba.rain['3h'] != null ? currentProba.rain['3h'] : currentProba.rain['6h'];
        }

        // The national vigilance map needs the optional API key: fetch it separately
        let vigilanceMapImage = null;
        if (box.modes && box.modes.vigilanceMap) {
          try {
            const mapData = await state.httpClient.get('/api/v1/service/meteofrance/vigilance/map');
            vigilanceMapImage = mapData.image;
          } catch (mapError) {
            // Map unavailable (no API key configured or API error): the widget shows a hint
          }
        }

        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          current,
          currentIcon,
          hourly,
          daily,
          sun,
          uv,
          rainChance,
          position: data.forecast.position || {},
          vigilance: data.vigilance || { alerts: [] },
          vigilanceMapImage
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
    }
  };
  return Object.assign({}, actions);
}

export default createActions;
