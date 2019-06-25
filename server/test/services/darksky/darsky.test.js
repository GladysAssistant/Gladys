const { expect, assert } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const weatherExample = require('./weather.json');

const workingAxios = {
  axios: {
    default: {
      get: () => ({ data: weatherExample }),
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
    getValue: () => Promise.resolve('DARK_SKY_API_KEY'),
  },
};

describe('DarkSkyService', () => {
  it('should start service', async () => {
    const DarkSkyService = proxyquire('../../../services/darksky/index', workingAxios);
    const darkSkyService = DarkSkyService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await darkSkyService.start();
  });
  it('should stop service', async () => {
    const DarkSkyService = proxyquire('../../../services/darksky/index', workingAxios);
    const darkSkyService = DarkSkyService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await darkSkyService.stop();
  });
  it('should return weather formatted', async () => {
    const DarkSkyService = proxyquire('../../../services/darksky/index', workingAxios);
    const darkSkyService = DarkSkyService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await darkSkyService.start();
    const weather = await darkSkyService.weather.get({
      latitude: 12,
      longitude: 10,
    });
    expect(weather).to.deep.equal({
      temperature: 54.87,
      humidity: 0.76,
      pressure: 1019.4,
      datetime: new Date('2019-03-28T07:50:18.000Z'),
      units: 'si',
      wind_speed: 5.25,
      weather: 'cloud',
    });
  });
  it('should return error, unable to contact third party provider', async () => {
    const DarkSkyService = proxyquire('../../../services/darksky/index', brokenAxios);
    const darkSkyService = DarkSkyService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await darkSkyService.start();
    const promise = darkSkyService.weather.get({
      latitude: 12,
      longitude: 10,
    });
    return assert.isRejected(promise, 'REQUEST_TO_THIRD_PARTY_FAILED');
  });
});
