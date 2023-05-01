const { expect, assert } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const weatherData = require('./weather-data-new.json');
const weatherForecast = require('./weather-forecast.json');
const expectedResult = require('./expected-result.json');
const { translateWeatherOWToGladys } = require('../../../services/openweather/lib/formatResults');

const workingAxios = {
  axios: {
    default: {
      get: (url) => {
        if (url.includes('2.5/weather?')) {
          return { data: weatherData };
        }
        return { data: weatherForecast };
      },
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
  house: {
    get: () =>
      Promise.resolve([
        {
          selector: 'house1',
          latitude: '1212111',
          longitude: '1212111',
        },
      ]),
  },
};

describe('OpenWeatherService', () => {
  it('should start service', async () => {
    const OpenWeatherService = proxyquire('../../../services/openweather/index', workingAxios);
    const openWeatherService = OpenWeatherService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await openWeatherService.start();
  });
  it('should stop service', async () => {
    const OpenWeatherService = proxyquire('../../../services/openweather/index', workingAxios);
    const openWeatherService = OpenWeatherService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await openWeatherService.stop();
  });
  it('should return clear weather formatted', async () => {
    const OpenWeatherService = proxyquire('../../../services/openweather/index', workingAxios);
    const openWeatherService = OpenWeatherService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await openWeatherService.start();
    const weather = await openWeatherService.weather.get({
      latitude: 12,
      longitude: 10,
    });
    expect(JSON.parse(JSON.stringify(weather))).to.deep.equal(expectedResult);
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
  it('should return unknown weather type', async () => {
    const result = translateWeatherOWToGladys({ main: 'UNKNWOWN' });
    expect(result).to.equal('unknown');
  });
});
