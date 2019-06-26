const { expect } = require('chai');
const { fake, assert } = require('sinon');
const EvenEmitter = require('events');

const event = new EvenEmitter();

const messageManager = {
  replyByIntent: fake.resolves(true),
};

const fakeWeather = {
  temperature: 54.87,
  humidity: 0.76,
  pressure: 1019.4,
  datetime: new Date('2019-03-28T07:50:18.000Z'),
  units: 'si',
  windSpeed: 5.25,
  weather: 'cloud',
};

const Weather = require('../../../lib/weather');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

const darkSky = {
  weather: {
    get: fake.resolves(fakeWeather),
  },
};

const service = {
  getService: () => darkSky,
};

const serviceWithoutDarkSky = {
  getService: () => null,
};

describe('weather.get', () => {
  it('should get the weather', async () => {
    const weather = new Weather(service, event, messageManager);
    const options = {
      latitude: 112,
      longitude: -2,
      offset: 0,
      language: 'fr',
      units: 'si',
    };
    const result = await weather.get(options);
    expect(result).to.deep.equal({
      temperature: 54.87,
      humidity: 0.76,
      pressure: 1019.4,
      datetime: new Date('2019-03-28T07:50:18.000Z'),
      units: 'si',
      windSpeed: 5.25,
      weather: 'cloud',
    });
    assert.calledWith(darkSky.weather.get, options);
  });
  it('should throw an error, service not configured', async () => {
    const weather = new Weather(serviceWithoutDarkSky, event);
    const options = {
      latitude: 112,
      longitude: -2,
      offset: 0,
      language: 'fr',
      units: 'si',
    };
    expect(() => {
      weather.get(options);
    }).to.throw(ServiceNotConfiguredError, 'Service darksky is not found or not configured');
  });
});
