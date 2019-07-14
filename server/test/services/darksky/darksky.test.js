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
      summary: 'cloudy',
      weather: 'cloud',
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
      summary: 'cloudy',
      weather: 'cloud',
    });
  });
  it('should return weather formatted in basic mode for a specific datetime', async () => {
    const DarkSkyService = proxyquire('../../../services/darksky/index', workingAxios);
    const darkSkyService = DarkSkyService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await darkSkyService.start();
    const weather = await darkSkyService.weather.get({
      latitude: 12,
      longitude: 10,
      mode: 'basic',
      datetime: '1562861076',
    });
    expect(weather).to.deep.equal({
      datetime: new Date('2019-03-28T07:50:18.000Z'),
      temperature: 54.87,
      time_sunrise: new Date('2019-03-28T14:02:00.000Z'),
      time_sunset: new Date('2019-03-29T02:29:43.000Z'),
      units: 'si',
      summary: 'cloudy',
      weather: 'cloud',
    });
  });
  it('should return weather formatted in basic mode with an offset', async () => {
    const DarkSkyService = proxyquire('../../../services/darksky/index', workingAxios);
    const darkSkyService = DarkSkyService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await darkSkyService.start();
    const weather = await darkSkyService.weather.get({
      latitude: 12,
      longitude: 10,
      mode: 'basic',
      offset: 2,
    });
    expect(weather).to.deep.equal({
      datetime: new Date('2019-03-28T07:50:18.000Z'),
      temperature: 54.87,
      time_sunrise: new Date('2019-03-28T14:02:00.000Z'),
      time_sunset: new Date('2019-03-29T02:29:43.000Z'),
      units: 'si',
      summary: 'cloudy',
      weather: 'cloud',
    });
  });

  it('should return weather formatted for daily target', async () => {
    const DarkSkyService = proxyquire('../../../services/darksky/index', workingAxios);
    const darkSkyService = DarkSkyService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await darkSkyService.start();
    const weather = await darkSkyService.weather.get({
      latitude: 12,
      longitude: 10,
      mode: 'basic',
      datetime: '1562861076',
      target: 'daily',
    });
    expect(weather).to.deep.equal({
      datetime: new Date('2019-03-28T07:00:00.000Z'),
      temperatureMin: 52,
      temperatureMax: 58,
      time_sunrise: new Date('2019-03-28T14:02:00.000Z'),
      time_sunset: new Date('2019-03-29T02:29:43.000Z'),
      units: 'si',
      summary: 'cloudy',
      weather: 'cloud',
    });
  });
  it('should return weather formatted for hourly target', async () => {
    const DarkSkyService = proxyquire('../../../services/darksky/index', workingAxios);
    const darkSkyService = DarkSkyService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await darkSkyService.start();
    const weather = await darkSkyService.weather.get({
      latitude: 12,
      longitude: 10,
      mode: 'basic',
      datetime: '1562861076',
      target: 'hourly',
    });
    expect(weather).to.deep.equal({
      datetime: new Date('2019-03-28T07:00:00.000Z'),
      temperature: 55,
      time_sunrise: new Date('2019-03-28T14:02:00.000Z'),
      time_sunset: new Date('2019-03-29T02:29:43.000Z'),
      units: 'si',
      summary: 'dark night',
      weather: 'night',
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
      datetime: new Date('2019-03-28T07:50:18.000Z'),
      hours: [
        {
          apparent_temperature: 55,
          datetime: new Date('2019-03-28T08:00:00.000Z'),
          precipitation_probability: 11,
          precipitation_type: 'rain',
          summary: 'Partly Cloudy',
          weather: 'rain',
        },
        {
          apparent_temperature: 54,
          datetime: new Date('2019-03-28T09:00:00.000Z'),
          precipitation_probability: 7,
          precipitation_type: 'rain',
          summary: 'Partly Cloudy',
          weather: 'clear',
        },
        {
          apparent_temperature: 53,
          datetime: new Date('2019-03-28T10:00:00.000Z'),
          precipitation_probability: 9,
          precipitation_type: 'rain',
          summary: 'Partly Cloudy',
          weather: 'snow',
        },
        {
          apparent_temperature: 52,
          datetime: new Date('2019-03-28T11:00:00.000Z'),
          precipitation_probability: 25,
          precipitation_type: 'rain',
          summary: 'Possible Light Rain',
          weather: 'wind',
        },
        {
          apparent_temperature: 52,
          datetime: new Date('2019-03-28T13:00:00.000Z'),
          precipitation_probability: 19,
          precipitation_type: 'rain',
          summary: 'Mostly Cloudy',
          weather: 'sleet',
        },
        {
          apparent_temperature: 52,
          datetime: new Date('2019-03-28T15:00:00.000Z'),
          precipitation_probability: 19,
          precipitation_type: 'rain',
          summary: 'Mostly Cloudy',
          weather: 'night',
        },
        {
          apparent_temperature: 54,
          datetime: new Date('2019-03-28T17:00:00.000Z'),
          precipitation_probability: 27,
          precipitation_type: 'rain',
          summary: 'Mostly Cloudy',
          weather: 'unknown',
        },
        {
          apparent_temperature: 56,
          datetime: new Date('2019-03-28T19:00:00.000Z'),
          precipitation_probability: 21,
          precipitation_type: 'rain',
          summary: 'Mostly Cloudy',
          weather: 'fog',
        },
      ],
      alert: {
        description:
          '...FLOOD WATCH REMAINS IN EFFECT THROUGH LATE MONDAY NIGHT...\nTHE FLOOD WATCH CONTINUES FOR\n* A PORTION OF NORTHWEST WASHINGTON...INCLUDING THE FOLLOWING\nCOUNTY...MASON.\n* THROUGH LATE FRIDAY NIGHT\n* A STRONG WARM FRONT WILL BRING HEAVY RAIN TO THE OLYMPICS\nTONIGHT THROUGH THURSDAY NIGHT. THE HEAVY RAIN WILL PUSH THE\nSKOKOMISH RIVER ABOVE FLOOD STAGE TODAY...AND MAJOR FLOODING IS\nPOSSIBLE.\n* A FLOOD WARNING IS IN EFFECT FOR THE SKOKOMISH RIVER. THE FLOOD\nWATCH REMAINS IN EFFECT FOR MASON COUNTY FOR THE POSSIBILITY OF\nAREAL FLOODING ASSOCIATED WITH A MAJOR FLOOD.\n',
        severity: 'warning',
        title: 'Flood Watch for Mason, WA',
      },
      temperature: 54.87,
      humidity: 76,
      time_sunrise: new Date('2019-03-28T14:02:00.000Z'),
      time_sunset: new Date('2019-03-29T02:29:43.000Z'),
      units: 'si',
      wind_speed: 5.25,
      summary: 'cloudy',
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
