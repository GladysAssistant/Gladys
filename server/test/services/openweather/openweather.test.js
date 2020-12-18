const { expect, assert } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const weatherExampleClear = require('./weather-clear.json');
const weatherExampleClouds = require('./weather-clouds.json');
const weatherExampleRain = require('./weather-rain.json');
const weatherExampleSnow = require('./weather-snow.json');
const weatherExampleDrizzle = require('./weather-drizzle.json');
const weatherExampleFog = require('./weather-fog.json');
const weatherExampleThunderStorm = require('./weather-thunderstorm.json');
const weatherExampleOther = require('./weather-other.json');

const workingAxiosClear = {
  axios: {
    default: {
      get: () => ({ data: weatherExampleClear }),
    },
  },
};

const workingAxiosClouds = {
  axios: {
    default: {
      get: () => ({ data: weatherExampleClouds }),
    },
  },
};

const workingAxiosRain = {
  axios: {
    default: {
      get: () => ({ data: weatherExampleRain }),
    },
  },
};

const workingAxiosSnow = {
  axios: {
    default: {
      get: () => ({ data: weatherExampleSnow }),
    },
  },
};

const workingAxiosDrizzle = {
  axios: {
    default: {
      get: () => ({ data: weatherExampleDrizzle }),
    },
  },
};

const workingAxiosFog = {
  axios: {
    default: {
      get: () => ({ data: weatherExampleFog }),
    },
  },
};

const workingAxiosThunderStorm = {
  axios: {
    default: {
      get: () => ({ data: weatherExampleThunderStorm }),
    },
  },
};

const workingAxiosOther = {
  axios: {
    default: {
      get: () => ({ data: weatherExampleOther }),
    },
  },
};

const brokenAxios = {
  axios: {
    default: {
      get: () => Promise.reject(new Error('broken')),
    },
  },
};

const gladys = {
  variable: {
    getValue: () => Promise.resolve('OPEN_WEATHER_API_KEY'),
  },
};

describe('OpenWeatherService', () => {
  const hours = [
    {
      datetime: new Date('2020-11-16T16:00:00.000Z'),
      humidity: 52,
      pressure: 1022,
      temperature: 16,
      units: 'metric',
      weather: 'cloud',
      wind_direction: 312,
      wind_speed: 5.36,
    },
    {
      datetime: new Date('2020-11-16T17:00:00.000Z'),
      humidity: 57,
      pressure: 1023,
      temperature: 15,
      units: 'metric',
      weather: 'cloud',
      wind_direction: 310,
      wind_speed: 5.79,
    },
    {
      datetime: new Date('2020-11-16T18:00:00.000Z'),
      humidity: 60,
      pressure: 1024,
      temperature: 14,
      units: 'metric',
      weather: 'cloud',
      wind_direction: 308,
      wind_speed: 6.22,
    },
    {
      datetime: new Date('2020-11-16T19:00:00.000Z'),
      humidity: 63,
      pressure: 1024,
      temperature: 13,
      units: 'metric',
      weather: 'clear',
      wind_direction: 306,
      wind_speed: 5.66,
    },
    {
      datetime: new Date('2020-11-16T20:00:00.000Z'),
      humidity: 63,
      pressure: 1025,
      temperature: 13,
      units: 'metric',
      weather: 'cloud',
      wind_direction: 307,
      wind_speed: 5.46,
    },
    {
      datetime: new Date('2020-11-16T21:00:00.000Z'),
      humidity: 63,
      pressure: 1025,
      temperature: 13,
      units: 'metric',
      weather: 'cloud',
      wind_direction: 310,
      wind_speed: 5.08,
    },
    {
      datetime: new Date('2020-11-16T22:00:00.000Z'),
      humidity: 64,
      pressure: 1026,
      temperature: 13,
      units: 'metric',
      weather: 'cloud',
      wind_direction: 309,
      wind_speed: 4.73,
    },
    {
      datetime: new Date('2020-11-16T23:00:00.000Z'),
      humidity: 65,
      pressure: 1026,
      temperature: 12,
      units: 'metric',
      weather: 'cloud',
      wind_direction: 307,
      wind_speed: 4.34,
    },
  ];

  const days = [
    {
      datetime: new Date('2020-11-17T11:00:00.000Z'),
      humidity: 48,
      pressure: 1026,
      temperature_max: 16,
      temperature_min: 11,
      units: 'metric',
      weather: 'cloud',
      wind_direction: 28,
      wind_speed: 3.5,
    },
    {
      datetime: new Date('2020-11-18T11:00:00.000Z'),
      humidity: 70,
      pressure: 1026,
      temperature_max: 15,
      temperature_min: 11,
      units: 'metric',
      weather: 'cloud',
      wind_direction: 112,
      wind_speed: 1.9,
    },
    {
      datetime: new Date('2020-11-19T11:00:00.000Z'),
      humidity: 64,
      pressure: 1025,
      temperature_max: 18,
      temperature_min: 12,
      units: 'metric',
      weather: 'clear',
      wind_direction: 350,
      wind_speed: 2.63,
    },
    {
      datetime: new Date('2020-11-20T11:00:00.000Z'),
      humidity: 56,
      pressure: 1023,
      temperature_max: 14,
      temperature_min: 9,
      units: 'metric',
      weather: 'cloud',
      wind_direction: 312,
      wind_speed: 10.07,
    },
    {
      datetime: new Date('2020-11-21T11:00:00.000Z'),
      humidity: 39,
      pressure: 1022,
      temperature_max: 13,
      temperature_min: 7,
      units: 'metric',
      weather: 'clear',
      wind_direction: 341,
      wind_speed: 3.89,
    },
    {
      datetime: new Date('2020-11-22T11:00:00.000Z'),
      humidity: 53,
      pressure: 1023,
      temperature_max: 12,
      temperature_min: 5,
      units: 'metric',
      weather: 'clear',
      wind_direction: 43,
      wind_speed: 3.42,
    },
    {
      datetime: new Date('2020-11-23T11:00:00.000Z'),
      humidity: 74,
      pressure: 1020,
      temperature_max: 13,
      temperature_min: 9,
      units: 'metric',
      weather: 'cloud',
      wind_direction: 56,
      wind_speed: 4.89,
    },
  ];

  it('should start service', async () => {
    const OpenWeatherService = proxyquire('../../../services/openweather/index', workingAxiosClear);
    const openWeatherService = OpenWeatherService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await openWeatherService.start();
  });
  it('should stop service', async () => {
    const OpenWeatherService = proxyquire('../../../services/openweather/index', workingAxiosClear);
    const openWeatherService = OpenWeatherService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await openWeatherService.stop();
  });
  it('should return clear weather formatted', async () => {
    const OpenWeatherService = proxyquire('../../../services/openweather/index', workingAxiosClear);
    const openWeatherService = OpenWeatherService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await openWeatherService.start();
    const weather = await openWeatherService.weather.get({
      latitude: 12,
      longitude: 10,
    });
    expect(weather).to.deep.equal({
      temperature: 17,
      humidity: 45,
      pressure: 1022,
      datetime: new Date('2020-11-16T15:55:10.000Z'),
      units: 'metric',
      wind_speed: 4.6,
      wind_direction: 320,
      weather: 'clear',
      days,
      hours,
    });
  });
  it('should return error, unable to contact third party provider', async () => {
    const OpenWeatherService = proxyquire('../../../services/openweather/index', brokenAxios);
    const openWeatherService = OpenWeatherService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await openWeatherService.start();
    const promise = openWeatherService.weather.get({
      latitude: 12,
      longitude: 10,
    });
    return assert.isRejected(promise, 'REQUEST_TO_THIRD_PARTY_FAILED');
  });
  it('should return cloud weather formatted', async () => {
    const OpenWeatherService = proxyquire('../../../services/openweather/index', workingAxiosClouds);
    const openWeatherService = OpenWeatherService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await openWeatherService.start();
    const weather = await openWeatherService.weather.get({
      latitude: 12,
      longitude: 10,
    });
    expect(weather).to.deep.equal({
      temperature: 17,
      humidity: 45,
      pressure: 1022,
      datetime: new Date('2020-11-16T15:55:10.000Z'),
      units: 'metric',
      wind_speed: 4.6,
      wind_direction: 320,
      weather: 'cloud',
      days,
      hours,
    });
  });
  it('should return rain weather formatted', async () => {
    const OpenWeatherService = proxyquire('../../../services/openweather/index', workingAxiosRain);
    const openWeatherService = OpenWeatherService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await openWeatherService.start();
    const weather = await openWeatherService.weather.get({
      latitude: 12,
      longitude: 10,
    });
    expect(weather).to.deep.equal({
      temperature: 17,
      humidity: 45,
      pressure: 1022,
      datetime: new Date('2020-11-16T15:55:10.000Z'),
      units: 'metric',
      wind_speed: 4.6,
      wind_direction: 320,
      weather: 'rain',
      days,
      hours,
    });
  });
  it('should return snow weather formatted', async () => {
    const OpenWeatherService = proxyquire('../../../services/openweather/index', workingAxiosSnow);
    const openWeatherService = OpenWeatherService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await openWeatherService.start();
    const weather = await openWeatherService.weather.get({
      latitude: 12,
      longitude: 10,
    });
    expect(weather).to.deep.equal({
      temperature: 17,
      humidity: 45,
      pressure: 1022,
      datetime: new Date('2020-11-16T15:55:10.000Z'),
      units: 'metric',
      wind_speed: 4.6,
      wind_direction: 320,
      weather: 'snow',
      days,
      hours,
    });
  });
  it('should return drizzle weather formatted', async () => {
    const OpenWeatherService = proxyquire('../../../services/openweather/index', workingAxiosDrizzle);
    const openWeatherService = OpenWeatherService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await openWeatherService.start();
    const weather = await openWeatherService.weather.get({
      latitude: 12,
      longitude: 10,
    });
    expect(weather).to.deep.equal({
      temperature: 17,
      humidity: 45,
      pressure: 1022,
      datetime: new Date('2020-11-16T15:55:10.000Z'),
      units: 'metric',
      wind_speed: 4.6,
      wind_direction: 320,
      weather: 'drizzle',
      days,
      hours,
    });
  });
  it('should return fog weather formatted', async () => {
    const OpenWeatherService = proxyquire('../../../services/openweather/index', workingAxiosFog);
    const openWeatherService = OpenWeatherService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await openWeatherService.start();
    const weather = await openWeatherService.weather.get({
      latitude: 12,
      longitude: 10,
    });
    expect(weather).to.deep.equal({
      temperature: 17,
      humidity: 45,
      pressure: 1022,
      datetime: new Date('2020-11-16T15:55:10.000Z'),
      units: 'metric',
      wind_speed: 4.6,
      wind_direction: 320,
      weather: 'fog',
      days,
      hours,
    });
  });
  it('should return thunderstorm weather formatted', async () => {
    const OpenWeatherService = proxyquire('../../../services/openweather/index', workingAxiosThunderStorm);
    const openWeatherService = OpenWeatherService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await openWeatherService.start();
    const weather = await openWeatherService.weather.get({
      latitude: 12,
      longitude: 10,
    });
    expect(weather).to.deep.equal({
      temperature: 17,
      humidity: 45,
      pressure: 1022,
      datetime: new Date('2020-11-16T15:55:10.000Z'),
      units: 'metric',
      wind_speed: 4.6,
      wind_direction: 320,
      weather: 'thunderstorm',
      days,
      hours,
    });
  });
  it('should return other weather formatted', async () => {
    const OpenWeatherService = proxyquire('../../../services/openweather/index', workingAxiosOther);
    const openWeatherService = OpenWeatherService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await openWeatherService.start();
    const weather = await openWeatherService.weather.get({
      latitude: 12,
      longitude: 10,
    });
    expect(weather).to.deep.equal({
      temperature: 17,
      humidity: 45,
      pressure: 1022,
      datetime: new Date('2020-11-16T15:55:10.000Z'),
      units: 'metric',
      wind_speed: 4.6,
      wind_direction: 320,
      weather: 'unknown',
      days,
      hours,
    });
  });
});
