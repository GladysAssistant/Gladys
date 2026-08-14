const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;
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
const { ServiceNotConfiguredError, ExternalIntegrationUnavailableError } = require('../../../utils/coreErrors');

const options = {
  latitude: 112,
  longitude: -2,
  offset: 0,
  language: 'fr',
  units: 'metric',
};

/**
 * @description Build a service manager mock over a map of services.
 * @param {object} services - Map of service name to service object.
 * @returns {object} The service manager mock.
 * @example
 * buildServiceManager({ openweather: { weather: { get: fake.resolves({}) } } });
 */
function buildServiceManager(services) {
  return {
    getService: (name) => (services[name] === undefined ? null : services[name]),
    stateManager: {
      getAllKeys: () => Object.keys(services),
    },
  };
}

describe('weather.get', () => {
  it('should get the weather from the only provider', async () => {
    const openWeather = {
      weather: {
        get: fake.resolves(fakeWeather),
      },
    };
    const service = buildServiceManager({ openweather: openWeather });
    const weather = new Weather(service, event, messageManager);
    const result = await weather.get(options);
    expect(result).to.deep.equal(fakeWeather);
    assert.calledWith(openWeather.weather.get, options);
  });
  it('should skip services without the weather capability', async () => {
    const openWeather = {
      weather: {
        get: fake.resolves(fakeWeather),
      },
    };
    const service = buildServiceManager({
      telegram: { message: { send: fake.resolves(null) } },
      'not-a-weather-service': {},
      openweather: openWeather,
    });
    const weather = new Weather(service, event, messageManager);
    const result = await weather.get(options);
    expect(result).to.deep.equal(fakeWeather);
  });
  it('should prefer an external weather integration over openweather', async () => {
    const externalWeather = { ...fakeWeather, temperature: 12.3 };
    const externalProvider = {
      weather: {
        get: fake.resolves(externalWeather),
      },
    };
    const openWeather = {
      weather: {
        get: fake.resolves(fakeWeather),
      },
    };
    const service = buildServiceManager({
      openweather: openWeather,
      'ext-william-meteo-france': externalProvider,
    });
    const weather = new Weather(service, event, messageManager);
    const result = await weather.get(options);
    expect(result).to.deep.equal(externalWeather);
    assert.calledWith(externalProvider.weather.get, options);
    assert.notCalled(openWeather.weather.get);
  });
  it('should fall back to the next provider when the first one fails', async () => {
    const externalProvider = {
      weather: {
        get: fake.rejects(new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_NOT_CONNECTED')),
      },
    };
    const openWeather = {
      weather: {
        get: fake.resolves(fakeWeather),
      },
    };
    const service = buildServiceManager({
      openweather: openWeather,
      'ext-william-meteo-france': externalProvider,
    });
    const weather = new Weather(service, event, messageManager);
    const result = await weather.get(options);
    expect(result).to.deep.equal(fakeWeather);
    assert.called(externalProvider.weather.get);
  });
  it('should throw a service not configured error when there is no provider at all', async () => {
    const service = buildServiceManager({
      telegram: { message: { send: fake.resolves(null) } },
    });
    const weather = new Weather(service, event, messageManager);
    const promise = weather.get(options);
    await promise.then(
      () => Promise.reject(new Error('should have failed')),
      (e) => {
        expect(e).to.be.instanceOf(ServiceNotConfiguredError);
      },
    );
  });
  it('should throw a service not configured error when every provider is not configured', async () => {
    const openWeather = {
      weather: {
        get: fake.rejects(new ServiceNotConfiguredError('Open Weather API Key not found')),
      },
    };
    const service = buildServiceManager({ openweather: openWeather });
    const weather = new Weather(service, event, messageManager);
    const promise = weather.get(options);
    await promise.then(
      () => Promise.reject(new Error('should have failed')),
      (e) => {
        expect(e).to.be.instanceOf(ServiceNotConfiguredError);
      },
    );
  });
  it('should surface external integration failures as a request-to-third-party error', async () => {
    const externalProvider = {
      weather: {
        get: fake.rejects(new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_COMMAND_TIMEOUT')),
      },
    };
    const service = buildServiceManager({ 'ext-william-meteo-france': externalProvider });
    const weather = new Weather(service, event, messageManager);
    const promise = weather.get(options);
    await promise.then(
      () => Promise.reject(new Error('should have failed')),
      (e) => {
        // the widget knows this error and shows its weather CTA; the
        // internal EXTERNAL_INTEGRATION_* code never leaks to the user
        expect(e.message).to.equal('REQUEST_TO_THIRD_PARTY_FAILED');
      },
    );
  });
  it('should pin the provider chosen in the widget configuration', async () => {
    const externalProvider = {
      weather: {
        get: fake.resolves({ ...fakeWeather, temperature: 12.3 }),
      },
    };
    const openWeather = {
      weather: {
        get: fake.resolves(fakeWeather),
      },
    };
    const service = buildServiceManager({
      openweather: openWeather,
      'ext-william-meteo-france': externalProvider,
    });
    const weather = new Weather(service, event, messageManager);
    // openweather wins although the external provider has precedence
    const result = await weather.get({ ...options, service: 'openweather' });
    expect(result).to.deep.equal(fakeWeather);
    assert.notCalled(externalProvider.weather.get);
  });
  it('should surface the failure of a pinned provider instead of falling back', async () => {
    const externalProvider = {
      weather: {
        get: fake.rejects(new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_COMMAND_TIMEOUT')),
      },
    };
    const openWeather = {
      weather: {
        get: fake.resolves(fakeWeather),
      },
    };
    const service = buildServiceManager({
      openweather: openWeather,
      'ext-william-meteo-france': externalProvider,
    });
    const weather = new Weather(service, event, messageManager);
    const promise = weather.get({ ...options, service: 'ext-william-meteo-france' });
    await promise.then(
      () => Promise.reject(new Error('should have failed')),
      (e) => {
        expect(e.message).to.equal('REQUEST_TO_THIRD_PARTY_FAILED');
      },
    );
    assert.notCalled(openWeather.weather.get);
  });
  it('should throw a service not configured error when the pinned provider is gone', async () => {
    const openWeather = {
      weather: {
        get: fake.resolves(fakeWeather),
      },
    };
    const service = buildServiceManager({ openweather: openWeather });
    const weather = new Weather(service, event, messageManager);
    const promise = weather.get({ ...options, service: 'ext-uninstalled-provider' });
    await promise.then(
      () => Promise.reject(new Error('should have failed')),
      (e) => {
        expect(e).to.be.instanceOf(ServiceNotConfiguredError);
      },
    );
    assert.notCalled(openWeather.weather.get);
  });
  it('should rethrow the first real failure over a not configured one', async () => {
    const realError = new Error('REQUEST_TO_THIRD_PARTY_FAILED');
    const externalProvider = {
      weather: {
        get: fake.rejects(realError),
      },
    };
    const openWeather = {
      weather: {
        get: fake.rejects(new ServiceNotConfiguredError('Open Weather API Key not found')),
      },
    };
    const service = buildServiceManager({
      openweather: openWeather,
      'ext-william-meteo-france': externalProvider,
    });
    const weather = new Weather(service, event, messageManager);
    const promise = weather.get(options);
    await promise.then(
      () => Promise.reject(new Error('should have failed')),
      (e) => {
        expect(e.message).to.equal('REQUEST_TO_THIRD_PARTY_FAILED');
      },
    );
  });
});

describe('weather.getProviders', () => {
  it('should list the weather providers in the precedence order of the loop', () => {
    const service = buildServiceManager({
      openweather: { weather: { get: fake.resolves({}) } },
      telegram: { message: { send: fake.resolves(null) } },
      'ext-meteo-france': { weather: { get: fake.resolves({}) } },
    });
    const weather = new Weather(service, event, messageManager);
    expect(weather.getProviders()).to.deep.equal(['ext-meteo-france', 'openweather']);
  });
});
