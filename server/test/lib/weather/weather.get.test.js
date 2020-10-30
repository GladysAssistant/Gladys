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
  units: 'metric',
  windSpeed: 5.25,
  weather: 'cloud',
};

const Weather = require('../../../lib/weather');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

const openWeather = {
  weather: {
    get: fake.resolves(fakeWeather),
  },
};

const service = {
  getService: () => openWeather,
};

const serviceWithoutOpenWeather = {
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
      units: 'metric',
    };
    const result = await weather.get(options);
    expect(result).to.deep.equal({
      temperature: 54.87,
      humidity: 0.76,
      pressure: 1019.4,
      datetime: new Date('2019-03-28T07:50:18.000Z'),
      units: 'metric',
      windSpeed: 5.25,
      weather: 'cloud',
    });
    assert.calledWith(openWeather.weather.get, options);
  });
  it('should throw an error, service not configured', async () => {
    const weather = new Weather(serviceWithoutOpenWeather, event);
    const options = {
      latitude: 112,
      longitude: -2,
      offset: 0,
      language: 'fr',
      units: 'metric',
    };
    expect(() => {
      weather.get(options);
    }).to.throw(ServiceNotConfiguredError, 'Service openweather is not found or not configured');
  });
});
