import dayjs from 'dayjs';

import { HOUSE } from './home';

/**
 * Weather and sun position of the demo house.
 *
 * Both are computed from the current date instead of being frozen fixtures:
 * the demo is a public showcase, a forecast starting three years ago looks
 * broken. The numbers are plausible, not real - no provider is called.
 */

const CONDITIONS = ['clear', 'clear', 'partly-cloudy', 'partly-cloudy', 'cloud', 'rain'];

// Same pseudo-random series on every reload, so a screenshot of the demo is
// always the same for a given hour
const noise = seed => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

const DEGREES = Math.PI / 180;
const toDegrees = radians => radians / DEGREES;
const round = (value, decimals = 2) => Math.round(value * 10 ** decimals) / 10 ** decimals;

const dayOfYear = date => dayjs(date).diff(dayjs(date).startOf('year'), 'day') + 1;

/**
 * Solar declination of a day of the year, from the usual approximation.
 * Enough for a demo widget: it gives the right season, the right day length
 * and a curve that peaks at noon.
 */
const declination = date => 23.44 * Math.sin(DEGREES * (360 / 365) * (dayOfYear(date) + 284));

/**
 * Local time at which the sun is at its highest. The demo house is at a fixed
 * longitude but the browser can be in any timezone, so the solar noon is
 * shifted by the longitude and by the offset of the visitor's clock: without
 * it the sun would rise in the middle of the night for half of the world.
 */
const solarNoon = date =>
  12 -
  HOUSE.longitude / 15 -
  dayjs(date)
    .toDate()
    .getTimezoneOffset() /
    60;

const hourAngleAt = date => {
  const day = dayjs(date);
  return (day.hour() + day.minute() / 60 - solarNoon(date)) * 15 * DEGREES;
};

const elevationAt = (date, latitude) => {
  const dec = declination(date) * DEGREES;
  const lat = latitude * DEGREES;
  const hourAngle = hourAngleAt(date);
  return toDegrees(Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(hourAngle)));
};

const azimuthAt = (date, latitude) => {
  const dec = declination(date) * DEGREES;
  const lat = latitude * DEGREES;
  const hourAngle = hourAngleAt(date);
  const elevation = elevationAt(date, latitude) * DEGREES;
  const cosAzimuth =
    (Math.sin(dec) - Math.sin(elevation) * Math.sin(lat)) / (Math.cos(elevation) * Math.cos(lat) || 1e-6);
  const azimuth = toDegrees(Math.acos(Math.max(-1, Math.min(1, cosAzimuth))));
  return round(hourAngle > 0 ? 360 - azimuth : azimuth);
};

/** Half of the day length, in hours. */
const halfDayLength = (date, latitude) => {
  const dec = declination(date) * DEGREES;
  const lat = latitude * DEGREES;
  const cosHourAngle = -Math.tan(lat) * Math.tan(dec);
  if (cosHourAngle <= -1) {
    return 12;
  }
  if (cosHourAngle >= 1) {
    return 0;
  }
  return toDegrees(Math.acos(cosHourAngle)) / 15;
};

const atHour = (date, hours) =>
  dayjs(date)
    .startOf('day')
    .add(hours * 60, 'minute');

const getSunState = () => {
  const now = dayjs();
  const { latitude } = HOUSE;
  const half = halfDayLength(now, latitude);
  const noon = solarNoon(now);
  const sunrise = atHour(now, noon - half);
  const sunset = atHour(now, noon + half);
  const curve = [];
  for (let minutes = 0; minutes <= 24 * 60; minutes += 15) {
    const time = now.startOf('day').add(minutes, 'minute');
    curve.push({ time: time.toISOString(), elevation: round(elevationAt(time, latitude)) });
  }
  return {
    dawn: sunrise.subtract(30, 'minute').toISOString(),
    sunrise: sunrise.toISOString(),
    solar_noon: atHour(now, noon).toISOString(),
    sunset: sunset.toISOString(),
    dusk: sunset.add(30, 'minute').toISOString(),
    azimuth: azimuthAt(now, latitude),
    elevation: round(elevationAt(now, latitude)),
    curve
  };
};

const isDayAt = date => elevationAt(date, HOUSE.latitude) > 0;

/**
 * Temperature of a given hour: a daily sine peaking around 4pm, on top of a
 * seasonal average for the latitude of the house.
 */
const temperatureAt = date => {
  const day = dayjs(date);
  const seasonal = 12.5 - 9 * Math.cos(DEGREES * (360 / 365) * (dayOfYear(day) - 15));
  const daily = 5 * Math.sin(DEGREES * ((day.hour() + day.minute() / 60 - 9) / 24) * 360);
  return round(seasonal + daily + noise(day.hour() + day.date()) * 1.5, 1);
};

const conditionAt = date =>
  CONDITIONS[Math.floor(noise(dayjs(date).hour() + dayjs(date).date() * 3) * CONDITIONS.length)];

const getWeather = () => {
  const now = dayjs();
  const sun = getSunState();

  const hours = [];
  for (let index = 0; index < 26; index += 1) {
    const time = now.startOf('hour').add(index, 'hour');
    const condition = conditionAt(time);
    hours.push({
      datetime: time.toISOString(),
      temperature: temperatureAt(time),
      humidity: Math.round(52 + noise(index) * 25),
      weather: condition,
      is_day: isDayAt(time),
      precipitation: condition === 'rain' ? round(noise(index + 7) * 2.4, 1) : 0,
      precipitation_probability:
        condition === 'rain' ? Math.round(55 + noise(index + 3) * 40) : Math.round(noise(index + 3) * 20),
      wind_speed: round(2 + noise(index + 11) * 5, 1),
      wind_direction: Math.round(noise(index + 13) * 360)
    });
  }

  const days = [];
  for (let index = 0; index < 7; index += 1) {
    const day = now.startOf('day').add(index, 'day');
    const condition = conditionAt(day.add(12, 'hour'));
    days.push({
      datetime: day.toISOString(),
      temperature_min: round(temperatureAt(day.add(5, 'hour')), 1),
      temperature_max: round(temperatureAt(day.add(16, 'hour')), 1),
      humidity: Math.round(55 + noise(index + 21) * 20),
      weather: condition,
      precipitation: condition === 'rain' ? round(noise(index + 5) * 6, 1) : 0,
      precipitation_probability:
        condition === 'rain' ? Math.round(60 + noise(index + 9) * 35) : Math.round(noise(index + 9) * 25),
      wind_speed: round(2 + noise(index + 17) * 6, 1),
      wind_direction: Math.round(noise(index + 19) * 360)
    });
  }

  const current = hours[0];

  return {
    temperature: current.temperature,
    humidity: current.humidity,
    pressure: 1017,
    datetime: now.toISOString(),
    units: 'metric',
    wind_speed: current.wind_speed,
    wind_direction: current.wind_direction,
    weather: current.weather,
    is_day: current.is_day,
    uv_index: isDayAt(now) ? 4 : 0,
    sunrise: sun.sunrise,
    sunset: sun.sunset,
    house: {
      id: HOUSE.id,
      name: HOUSE.name,
      selector: HOUSE.selector
    },
    options: {
      latitude: HOUSE.latitude,
      longitude: HOUSE.longitude,
      language: 'en'
    },
    alerts: [],
    hours,
    days
  };
};

export { getWeather, getSunState };
