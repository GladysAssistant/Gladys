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
  it('should return weather formatted without any mode specified', async () => {
    const DarkSkyService = proxyquire('../../../services/darksky/index', workingAxios);
    const darkSkyService = DarkSkyService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await darkSkyService.start();
    const weather = await darkSkyService.weather.get({
      latitude: 12,
      longitude: 10,
    });
    expect(weather).to.deep.equal({
      datetime: new Date('2019-03-28T07:50:18.000Z'),
      temperature: 54.87,
      time_sunrise: new Date('2019-03-28T14:02:00.000Z'),
      time_sunset: new Date('2019-03-29T02:29:43.000Z'),
      units: 'si',
      weather: 'partly-cloudy-night',
    });
  });
  it('should return weather formatted in basic mode', async () => {
    const DarkSkyService = proxyquire('../../../services/darksky/index', workingAxios);
    const darkSkyService = DarkSkyService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await darkSkyService.start();
    const weather = await darkSkyService.weather.get({
      latitude: 12,
      longitude: 10,
      mode: 'basic',
    });
    expect(weather).to.deep.equal({
      datetime: new Date('2019-03-28T07:50:18.000Z'),
      temperature: 54.87,
      time_sunrise: new Date('2019-03-28T14:02:00.000Z'),
      time_sunset: new Date('2019-03-29T02:29:43.000Z'),
      units: 'si',
      weather: 'partly-cloudy-night',
    });
  });
  it('should return weather formatted in advanced mode', async () => {
    const DarkSkyService = proxyquire('../../../services/darksky/index', workingAxios);
    const darkSkyService = DarkSkyService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await darkSkyService.start();
    const weather = await darkSkyService.weather.get({
      latitude: 12,
      longitude: 10,
      mode: 'advanced',
    });
    expect(weather).to.deep.equal({
      alert: null,
      datetime: new Date('2019-03-28T07:50:18.000Z'),
      hours: [
        {
          apparent_temperature: 55,
          datetime: new Date('2019-03-28T08:00:00.000Z'),
          precipitation_probability: 11,
          precipitation_type: 'rain',
          summary: 'Partly Cloudy',
          weather: 'partly-cloudy-night',
        },
        {
          apparent_temperature: 54,
          datetime: new Date('2019-03-28T09:00:00.000Z'),
          precipitation_probability: 7,
          precipitation_type: 'rain',
          summary: 'Partly Cloudy',
          weather: 'partly-cloudy-night',
        },
        {
          apparent_temperature: 53,
          datetime: new Date('2019-03-28T10:00:00.000Z'),
          precipitation_probability: 9,
          precipitation_type: 'rain',
          summary: 'Partly Cloudy',
          weather: 'partly-cloudy-night',
        },
        {
          apparent_temperature: 52,
          datetime: new Date('2019-03-28T11:00:00.000Z'),
          precipitation_probability: 25,
          precipitation_type: 'rain',
          summary: 'Possible Light Rain',
          weather: 'rain',
        },
        {
          apparent_temperature: 52,
          datetime: new Date('2019-03-28T12:00:00.000Z'),
          precipitation_probability: 23,
          precipitation_type: 'rain',
          summary: 'Mostly Cloudy',
          weather: 'partly-cloudy-night',
        },
        {
          apparent_temperature: 52,
          datetime: new Date('2019-03-28T13:00:00.000Z'),
          precipitation_probability: 19,
          precipitation_type: 'rain',
          summary: 'Mostly Cloudy',
          weather: 'partly-cloudy-night',
        },
        {
          apparent_temperature: 52,
          datetime: new Date('2019-03-28T14:00:00.000Z'),
          precipitation_probability: 18,
          precipitation_type: 'rain',
          summary: 'Overcast',
          weather: 'cloudy',
        },
        {
          apparent_temperature: 52,
          datetime: new Date('2019-03-28T15:00:00.000Z'),
          precipitation_probability: 19,
          precipitation_type: 'rain',
          summary: 'Mostly Cloudy',
          weather: 'partly-cloudy-day',
        },
      ],
      temperature: 54.87,
      humidity: 76,
      time_sunrise: new Date('2019-03-28T14:02:00.000Z'),
      time_sunset: new Date('2019-03-29T02:29:43.000Z'),
      units: 'si',
      wind_speed: 5.25,
      weather: 'partly-cloudy-night',
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
