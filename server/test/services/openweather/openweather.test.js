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
      temperature: 17.31,
      humidity: 48,
      name: 'Belvedere Tiburon',
      pressure: 1020,
      datetime: new Date('2019-03-28T07:50:18.000Z'),
      units: 'metric',
      wind_speed: 4.02,
      wind_direction: 265,
      weather: 'clear',
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
  it('should return clouds weather formatted', async () => {
    const OpenWeatherService = proxyquire('../../../services/openweather/index', workingAxiosClouds);
    const openWeatherService = OpenWeatherService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await openWeatherService.start();
    const weather = await openWeatherService.weather.get({
      latitude: 12,
      longitude: 10,
    });
    expect(weather).to.deep.equal({
      temperature: 17.31,
      humidity: 48,
      name: 'Belvedere Tiburon',
      pressure: 1020,
      datetime: new Date('2019-03-28T07:50:18.000Z'),
      units: 'metric',
      wind_speed: 4.02,
      wind_direction: 265,
      weather: 'cloud',
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
      temperature: 17.31,
      humidity: 48,
      name: 'Belvedere Tiburon',
      pressure: 1020,
      datetime: new Date('2019-03-28T07:50:18.000Z'),
      units: 'metric',
      wind_speed: 4.02,
      wind_direction: 265,
      weather: 'rain',
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
      temperature: 17.31,
      humidity: 48,
      name: 'Belvedere Tiburon',
      pressure: 1020,
      datetime: new Date('2019-03-28T07:50:18.000Z'),
      units: 'metric',
      wind_speed: 4.02,
      wind_direction: 265,
      weather: 'snow',
    });
  });
  it('should return snow weather formatted', async () => {
    const OpenWeatherService = proxyquire('../../../services/openweather/index', workingAxiosDrizzle);
    const openWeatherService = OpenWeatherService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await openWeatherService.start();
    const weather = await openWeatherService.weather.get({
      latitude: 12,
      longitude: 10,
    });
    expect(weather).to.deep.equal({
      temperature: 17.31,
      humidity: 48,
      name: 'Belvedere Tiburon',
      pressure: 1020,
      datetime: new Date('2019-03-28T07:50:18.000Z'),
      units: 'metric',
      wind_speed: 4.02,
      wind_direction: 265,
      weather: 'drizzle',
    });
  });
  it('should return snow weather formatted', async () => {
    const OpenWeatherService = proxyquire('../../../services/openweather/index', workingAxiosFog);
    const openWeatherService = OpenWeatherService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await openWeatherService.start();
    const weather = await openWeatherService.weather.get({
      latitude: 12,
      longitude: 10,
    });
    expect(weather).to.deep.equal({
      temperature: 17.31,
      humidity: 48,
      name: 'Belvedere Tiburon',
      pressure: 1020,
      datetime: new Date('2019-03-28T07:50:18.000Z'),
      units: 'metric',
      wind_speed: 4.02,
      wind_direction: 265,
      weather: 'fog',
    });
  });
  it('should return snow weather formatted', async () => {
    const OpenWeatherService = proxyquire('../../../services/openweather/index', workingAxiosThunderStorm);
    const openWeatherService = OpenWeatherService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await openWeatherService.start();
    const weather = await openWeatherService.weather.get({
      latitude: 12,
      longitude: 10,
    });
    expect(weather).to.deep.equal({
      temperature: 17.31,
      humidity: 48,
      name: 'Belvedere Tiburon',
      pressure: 1020,
      datetime: new Date('2019-03-28T07:50:18.000Z'),
      units: 'metric',
      wind_speed: 4.02,
      wind_direction: 265,
      weather: 'thunderstorm',
    });
  });
  it('should return snow weather formatted', async () => {
    const OpenWeatherService = proxyquire('../../../services/openweather/index', workingAxiosOther);
    const openWeatherService = OpenWeatherService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await openWeatherService.start();
    const weather = await openWeatherService.weather.get({
      latitude: 12,
      longitude: 10,
    });
    expect(weather).to.deep.equal({
      temperature: 17.31,
      humidity: 48,
      name: 'Belvedere Tiburon',
      pressure: 1020,
      datetime: new Date('2019-03-28T07:50:18.000Z'),
      units: 'metric',
      wind_speed: 4.02,
      wind_direction: 265,
      weather: 'unknown',
    });
  });
});
