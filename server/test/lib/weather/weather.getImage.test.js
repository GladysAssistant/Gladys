const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;
const EventEmitter = require('events');

const Weather = require('../../../lib/weather');
const { NotFoundError, ExternalIntegrationUnavailableError } = require('../../../utils/coreErrors');
const { Error400 } = require('../../../utils/httpErrors');
const { ERROR_MESSAGES } = require('../../../utils/constants');

const event = new EventEmitter();

const buildServiceManager = (servicesByName) => ({
  getService: (name) => servicesByName[name],
  stateManager: {
    getAllKeys: () => Object.keys(servicesByName),
  },
});

describe('weather.getImage', () => {
  it('should get the image from the only provider exposing getImage', async () => {
    const service = buildServiceManager({
      openweather: { weather: { get: fake.resolves({}) } },
      'ext-meteo-france': { weather: { get: fake.resolves({}), getImage: fake.resolves('data:image/png;base64,ok') } },
    });
    const weather = new Weather(service, event, {}, {});
    const image = await weather.getImage('vigilance-map');
    expect(image).to.equal('data:image/png;base64,ok');
  });

  it('should fall back to the next provider when the first fails and stop at the first success', async () => {
    const failing = { weather: { get: fake.resolves({}), getImage: fake.rejects(new Error('down')) } };
    const working = { weather: { get: fake.resolves({}), getImage: fake.resolves('data:image/png;base64,ok') } };
    const untouched = { weather: { get: fake.resolves({}), getImage: fake.resolves('data:image/png;base64,no') } };
    const service = buildServiceManager({
      'ext-a-failing': failing,
      'ext-b-working': working,
      'ext-c-untouched': untouched,
    });
    const weather = new Weather(service, event, {}, {});
    const image = await weather.getImage('vigilance-map');
    expect(image).to.equal('data:image/png;base64,ok');
    expect(untouched.weather.getImage.callCount).to.equal(0);
  });

  it('should pin the provider of the widget for its images', async () => {
    const first = { weather: { get: fake.resolves({}), getImage: fake.resolves('data:image/png;base64,first') } };
    const second = { weather: { get: fake.resolves({}), getImage: fake.resolves('data:image/png;base64,second') } };
    const service = buildServiceManager({ 'ext-a-first': first, 'ext-b-second': second });
    const weather = new Weather(service, event, {}, {});
    // the pinned provider wins although the first one has precedence
    const image = await weather.getImage('vigilance-map', 'ext-b-second');
    expect(image).to.equal('data:image/png;base64,second');
    expect(first.weather.getImage.callCount).to.equal(0);
  });

  it('should throw NotFoundError when the pinned provider is gone', async () => {
    const provider = { weather: { get: fake.resolves({}), getImage: fake.resolves('data:image/png;base64,ok') } };
    const service = buildServiceManager({ 'ext-a-first': provider });
    const weather = new Weather(service, event, {}, {});
    await expect(weather.getImage('vigilance-map', 'ext-uninstalled')).to.be.rejectedWith(NotFoundError);
    expect(provider.weather.getImage.callCount).to.equal(0);
  });

  it('should 404 a key outside the declared-key shape without consulting any provider', async () => {
    const provider = {
      weather: { get: fake.resolves({}), getImage: fake.resolves('data:image/png;base64,ok') },
    };
    const service = buildServiceManager({ 'ext-meteo-france': provider });
    const weather = new Weather(service, event, {}, {});
    await expect(weather.getImage('NOT A KEY !!')).to.be.rejectedWith(NotFoundError);
    await expect(weather.getImage(`${'a'.repeat(40)}`)).to.be.rejectedWith(NotFoundError);
    await expect(weather.getImage(42)).to.be.rejectedWith(NotFoundError);
    expect(provider.weather.getImage.callCount).to.equal(0);
  });

  it('should throw NotFoundError when no provider serves images', async () => {
    const service = buildServiceManager({
      openweather: { weather: { get: fake.resolves({}) } },
    });
    const weather = new Weather(service, event, {}, {});
    await expect(weather.getImage('vigilance-map')).to.be.rejectedWith(NotFoundError);
  });

  it('should surface an integration failure as REQUEST_TO_THIRD_PARTY_FAILED', async () => {
    const service = buildServiceManager({
      'ext-meteo-france': {
        weather: {
          get: fake.resolves({}),
          getImage: fake.rejects(new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_INVALID_WEATHER_IMAGE')),
        },
      },
    });
    const weather = new Weather(service, event, {}, {});
    try {
      await weather.getImage('vigilance-map');
      expect.fail('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(Error400);
      expect(e.message).to.equal(ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED);
    }
  });

  it('should rethrow the first failure when every provider fails', async () => {
    const service = buildServiceManager({
      'ext-a-first': { weather: { get: fake.resolves({}), getImage: fake.rejects(new Error('boom-first')) } },
      'ext-b-second': { weather: { get: fake.resolves({}), getImage: fake.rejects(new Error('boom-second')) } },
    });
    const weather = new Weather(service, event, {}, {});
    await expect(weather.getImage('vigilance-map')).to.be.rejectedWith('boom-first');
  });
});
