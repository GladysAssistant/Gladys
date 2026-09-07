const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert: sinonAssert, fake } = sinon;

const { WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { ExternalIntegrationUnavailableError, NotFoundError } = require('../../../utils/coreErrors');
const { normalizeWeather } = require('../../../lib/external-integration/externalIntegration.normalizeWeather');
const {
  normalizeWeatherImage,
} = require('../../../lib/external-integration/externalIntegration.normalizeWeatherImage');
const { WEATHER_GET_TIMEOUT_MS, MAX_WEATHER_IMAGE_BYTES } = require('../../../lib/external-integration/constants');
const { buildSupervisor, seedExternalService, TEST_WEATHER_MANIFEST } = require('./testUtils.test');

const seedWeatherService = (overrides = {}) => seedExternalService({ manifest: TEST_WEATHER_MANIFEST, ...overrides });

const VALID_PAYLOAD = {
  temperature: 21.4,
  apparent_temperature: 20.2,
  weather: 'rain',
  datetime: '2026-08-01T12:00:00.000Z',
  humidity: 76,
  pressure: 1013,
  dew_point: 16.8,
  wind_speed: 4.2,
  wind_direction: 220,
  wind_gust: 9.1,
  visibility: 10,
  cloud_cover: 75,
  uv_index: 5,
  sunrise: '2026-08-01T04:38:00.000Z',
  sunset: '2026-08-01T19:24:00.000Z',
  hours: [
    {
      temperature: 20.1,
      apparent_temperature: 19.4,
      weather: 'cloud',
      datetime: '2026-08-01T13:00:00.000Z',
      humidity: 80,
      wind_gust: 11.3,
      cloud_cover: 90,
      precipitation: 1.2,
      precipitation_probability: 40,
      uv_index: 4,
    },
  ],
  days: [
    {
      temperature_min: 14,
      temperature_max: 24,
      datetime: '2026-08-02T11:00:00.000Z',
      weather: 'clear',
      humidity: 60,
      wind_speed: 3.4,
      precipitation: 0.4,
      precipitation_probability: 10,
      uv_index: 7,
      sunrise: '2026-08-02T04:39:00.000Z',
      sunset: '2026-08-02T19:23:00.000Z',
    },
  ],
  alerts: [
    {
      severity: 'severe',
      event: 'Orages',
      description: 'Vigilance orange orages sur le département.',
      start: '2026-08-01T14:00:00.000Z',
      end: '2026-08-02T02:00:00.000Z',
    },
  ],
};

describe('externalIntegration weather proxy capability', () => {
  it('should expose weather.get on weather integrations only', async () => {
    const { externalIntegration, stateManager } = buildSupervisor();
    const weatherService = await seedWeatherService();
    externalIntegration.registerProxyService(weatherService);
    const weatherProxy = stateManager.get('service', weatherService.name);
    expect(weatherProxy.weather).to.be.an('object');
    expect(weatherProxy.weather.get).to.be.a('function');
    const deviceService = await seedExternalService({
      name: 'ext-dev-device-demo',
      selector: 'ext-dev-device-demo',
    });
    externalIntegration.registerProxyService(deviceService);
    const deviceProxy = stateManager.get('service', deviceService.name);
    expect(deviceProxy.weather).to.equal(undefined);
  });

  it('should relay weather.get over websocket and normalize the payload', async () => {
    const { externalIntegration, stateManager } = buildSupervisor();
    const service = await seedWeatherService();
    externalIntegration.registerProxyService(service);
    externalIntegration.sendCommand = fake.resolves({ success: true, data: { weather: VALID_PAYLOAD } });
    const proxyService = stateManager.get('service', service.name);
    const weather = await proxyService.weather.get({
      latitude: 48.85,
      longitude: 2.35,
      language: 'fr',
      units: 'metric',
    });
    sinonAssert.calledWith(
      externalIntegration.sendCommand,
      service,
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.WEATHER_GET,
      {
        options: { latitude: 48.85, longitude: 2.35, language: 'fr', units: 'metric' },
      },
      { timeoutMs: WEATHER_GET_TIMEOUT_MS },
    );
    expect(weather.temperature).to.equal(21.4);
    expect(weather.weather).to.equal('rain');
    expect(weather.units).to.equal('metric');
    expect(weather.datetime).to.deep.equal(new Date('2026-08-01T12:00:00.000Z'));
    expect(weather.alerts).to.have.lengthOf(1);
  });

  it('should fail on a command result without a weather payload', async () => {
    const { externalIntegration, stateManager } = buildSupervisor();
    const service = await seedWeatherService();
    externalIntegration.registerProxyService(service);
    externalIntegration.sendCommand = fake.resolves({ success: true, data: {} });
    const proxyService = stateManager.get('service', service.name);
    await expect(proxyService.weather.get({ latitude: 0, longitude: 0 })).to.be.rejectedWith(
      ExternalIntegrationUnavailableError,
    );
  });
});

describe('externalIntegration.normalizeWeather', () => {
  it('should normalize a full payload', () => {
    const weather = normalizeWeather(VALID_PAYLOAD, 'metric');
    expect(weather).to.deep.equal({
      temperature: 21.4,
      apparent_temperature: 20.2,
      datetime: new Date('2026-08-01T12:00:00.000Z'),
      weather: 'rain',
      units: 'metric',
      humidity: 76,
      pressure: 1013,
      dew_point: 16.8,
      wind_speed: 4.2,
      wind_direction: 220,
      wind_gust: 9.1,
      visibility: 10,
      cloud_cover: 75,
      uv_index: 5,
      sunrise: new Date('2026-08-01T04:38:00.000Z'),
      sunset: new Date('2026-08-01T19:24:00.000Z'),
      hours: [
        {
          temperature: 20.1,
          apparent_temperature: 19.4,
          datetime: new Date('2026-08-01T13:00:00.000Z'),
          weather: 'cloud',
          units: 'metric',
          humidity: 80,
          wind_gust: 11.3,
          cloud_cover: 90,
          precipitation: 1.2,
          precipitation_probability: 40,
          uv_index: 4,
        },
      ],
      days: [
        {
          temperature_min: 14,
          temperature_max: 24,
          datetime: new Date('2026-08-02T11:00:00.000Z'),
          weather: 'clear',
          humidity: 60,
          wind_speed: 3.4,
          precipitation: 0.4,
          precipitation_probability: 10,
          uv_index: 7,
          sunrise: new Date('2026-08-02T04:39:00.000Z'),
          sunset: new Date('2026-08-02T19:23:00.000Z'),
        },
      ],
      alerts: [
        {
          severity: 'severe',
          event: 'Orages',
          description: 'Vigilance orange orages sur le département.',
          start: new Date('2026-08-01T14:00:00.000Z'),
          end: new Date('2026-08-02T02:00:00.000Z'),
        },
      ],
    });
  });

  it('should stamp imperial units on a us request and never echo the integration', () => {
    const weather = normalizeWeather(
      { temperature: 70, weather: 'clear', datetime: '2026-08-01T12:00:00.000Z', units: 'whatever' },
      'us',
    );
    expect(weather.units).to.equal('imperial');
  });

  it('should coerce an unknown condition to unknown and drop unknown fields', () => {
    const weather = normalizeWeather(
      {
        temperature: '12.5',
        weather: 'p9j',
        datetime: '2026-08-01T12:00:00.000Z',
        humidity: 'not-a-number',
        pressure: '',
        malicious_field: 'dropped',
        hours: [
          { temperature: 12, weather: 'rain', datetime: 'not-a-date' },
          { temperature: 11, weather: 'nope', datetime: '2026-08-01T13:00:00.000Z' },
          null,
        ],
        days: [
          { temperature_min: 1, temperature_max: 2, datetime: '2026-08-02T11:00:00.000Z' },
          { temperature_min: null, temperature_max: 2, datetime: '2026-08-02T11:00:00.000Z' },
          'not-an-object',
        ],
        alerts: [
          { severity: 'red', event: 'Orages' },
          { severity: 'extreme', event: '   ' },
          { severity: 'extreme', event: 42 },
          { severity: 'moderate', event: ' Vent violent ', description: '   ', start: 'not-a-date' },
          null,
        ],
      },
      'metric',
    );
    expect(weather.temperature).to.equal(12.5);
    expect(weather.weather).to.equal('unknown');
    expect(weather.humidity).to.equal(undefined);
    expect(weather.pressure).to.equal(undefined);
    expect(weather.malicious_field).to.equal(undefined);
    // the hour without a valid datetime is dropped, the invalid condition is coerced
    expect(weather.hours).to.have.lengthOf(1);
    expect(weather.hours[0].weather).to.equal('unknown');
    // the day without a valid temperature_min is dropped, no condition when absent
    expect(weather.days).to.have.lengthOf(1);
    expect(weather.days[0].weather).to.equal(undefined);
    // only the CAP severity with a non-empty string event survives; the
    // blank description and invalid start are dropped
    expect(weather.alerts).to.deep.equal([{ severity: 'moderate', event: 'Vent violent' }]);
  });

  it('should clamp the percent fields to 0-100', () => {
    const weather = normalizeWeather(
      {
        temperature: 10,
        weather: 'rain',
        datetime: '2026-08-01T12:00:00.000Z',
        humidity: 150,
        cloud_cover: -5,
        hours: [
          {
            temperature: 9,
            weather: 'rain',
            datetime: '2026-08-01T13:00:00.000Z',
            precipitation_probability: 400,
          },
        ],
      },
      'metric',
    );
    expect(weather.humidity).to.equal(100);
    expect(weather.cloud_cover).to.equal(0);
    expect(weather.hours[0].precipitation_probability).to.equal(100);
  });

  it('should accept the finer conditions and the strict-boolean is_day flag', () => {
    const weather = normalizeWeather(
      {
        temperature: 10,
        weather: 'partly-cloudy',
        datetime: '2026-08-01T22:00:00.000Z',
        is_day: false,
        hours: [
          { temperature: 9, weather: 'pouring', datetime: '2026-08-01T23:00:00.000Z', is_day: false },
          // non-boolean is_day values are dropped, never coerced
          { temperature: 8, weather: 'hail', datetime: '2026-08-02T00:00:00.000Z', is_day: 1 },
          { temperature: 8, weather: 'hail', datetime: '2026-08-02T01:00:00.000Z' },
        ],
      },
      'metric',
    );
    expect(weather.weather).to.equal('partly-cloudy');
    expect(weather.is_day).to.equal(false);
    expect(weather.hours[0].weather).to.equal('pouring');
    expect(weather.hours[0].is_day).to.equal(false);
    expect(weather.hours[1].weather).to.equal('hail');
    expect(weather.hours[1].is_day).to.equal(undefined);
    expect(weather.hours[2].is_day).to.equal(undefined);
  });

  it('should accept the extended conditions and still coerce an unknown one', () => {
    const weather = normalizeWeather(
      {
        temperature: -2,
        weather: 'freezing-rain',
        datetime: '2026-01-15T08:00:00.000Z',
        hours: [
          { temperature: -3, weather: 'freezing-fog', datetime: '2026-01-15T09:00:00.000Z' },
          { temperature: -1, weather: 'snow-thunderstorm', datetime: '2026-01-15T10:00:00.000Z' },
          { temperature: 28, weather: 'sandstorm', datetime: '2026-01-15T11:00:00.000Z' },
          { temperature: 24, weather: 'tornado', datetime: '2026-01-15T12:00:00.000Z' },
          { temperature: 26, weather: 'hurricane', datetime: '2026-01-15T13:00:00.000Z' },
          // still not a condition of the enum: coerced, not passed through
          { temperature: 20, weather: 'p14bisj', datetime: '2026-01-15T14:00:00.000Z' },
        ],
      },
      'metric',
    );
    expect(weather.weather).to.equal('freezing-rain');
    expect(weather.hours[0].weather).to.equal('freezing-fog');
    expect(weather.hours[1].weather).to.equal('snow-thunderstorm');
    expect(weather.hours[2].weather).to.equal('sandstorm');
    expect(weather.hours[3].weather).to.equal('tornado');
    expect(weather.hours[4].weather).to.equal('hurricane');
    expect(weather.hours[5].weather).to.equal('unknown');
  });

  it('should keep a valid alert type and drop an invalid one without rejecting the alert', () => {
    const weather = normalizeWeather(
      {
        temperature: 10,
        weather: 'rain',
        datetime: '2026-08-01T12:00:00.000Z',
        alerts: [
          { severity: 'severe', event: 'Vent violent', type: 'wind' },
          { severity: 'moderate', event: 'Phénomène local', type: 'tornado-of-frogs' },
        ],
      },
      'metric',
    );
    expect(weather.alerts).to.deep.equal([
      { severity: 'severe', event: 'Vent violent', type: 'wind' },
      { severity: 'moderate', event: 'Phénomène local' },
    ]);
  });

  it('should cap the hours, days and alerts arrays', () => {
    const hour = { temperature: 10, weather: 'rain', datetime: '2026-08-01T13:00:00.000Z' };
    const day = { temperature_min: 1, temperature_max: 2, datetime: '2026-08-02T11:00:00.000Z' };
    const alert = { severity: 'minor', event: 'Pluie' };
    const weather = normalizeWeather(
      {
        temperature: 10,
        weather: 'rain',
        datetime: '2026-08-01T12:00:00.000Z',
        hours: Array.from({ length: 50 }, () => hour),
        days: Array.from({ length: 50 }, () => day),
        alerts: Array.from({ length: 50 }, () => alert),
      },
      'metric',
    );
    expect(weather.hours).to.have.lengthOf(24);
    expect(weather.days).to.have.lengthOf(8);
    expect(weather.alerts).to.have.lengthOf(10);
  });

  it('should bound the alert event and description lengths', () => {
    const weather = normalizeWeather(
      {
        temperature: 10,
        weather: 'rain',
        datetime: '2026-08-01T12:00:00.000Z',
        alerts: [{ severity: 'extreme', event: 'x'.repeat(500), description: 'y'.repeat(6000) }],
      },
      'metric',
    );
    expect(weather.alerts[0].event).to.have.lengthOf(100);
    expect(weather.alerts[0].description).to.have.lengthOf(5000);
  });

  it('should reject a payload that is not an object', () => {
    expect(() => normalizeWeather(null, 'metric')).to.throw(ExternalIntegrationUnavailableError);
    expect(() => normalizeWeather('weather', 'metric')).to.throw(ExternalIntegrationUnavailableError);
    expect(() => normalizeWeather([], 'metric')).to.throw(ExternalIntegrationUnavailableError);
  });

  it('should reject a payload without the required fields', () => {
    expect(() => normalizeWeather({ weather: 'rain', datetime: '2026-08-01T12:00:00.000Z' }, 'metric')).to.throw(
      ExternalIntegrationUnavailableError,
    );
    expect(() => normalizeWeather({ temperature: Infinity, datetime: '2026-08-01T12:00:00.000Z' }, 'metric')).to.throw(
      ExternalIntegrationUnavailableError,
    );
    expect(() => normalizeWeather({ temperature: 12, weather: 'rain' }, 'metric')).to.throw(
      ExternalIntegrationUnavailableError,
    );
    expect(() => normalizeWeather({ temperature: 12, weather: 'rain', datetime: {} }, 'metric')).to.throw(
      ExternalIntegrationUnavailableError,
    );
  });
});

describe('externalIntegration.normalizeWeather images metadata', () => {
  const base = { temperature: 10, weather: 'rain', datetime: '2026-08-01T12:00:00.000Z' };

  it('should keep valid image metadata and bound the labels', () => {
    const weather = normalizeWeather(
      {
        ...base,
        images: [
          { key: 'vigilance-map', label: { en: 'Vigilance map', fr: `  ${'x'.repeat(80)}  ` } },
          { key: 'rain-radar' },
        ],
      },
      'metric',
    );
    expect(weather.images).to.have.lengthOf(2);
    expect(weather.images[0].key).to.equal('vigilance-map');
    expect(weather.images[0].label.en).to.equal('Vigilance map');
    expect(weather.images[0].label.fr).to.have.lengthOf(50);
    expect(weather.images[1]).to.deep.equal({ key: 'rain-radar' });
  });

  it('should drop invalid entries, invalid keys, duplicates and cap at 3', () => {
    // the slice(0, 3) cap applies before validation: spread the invalid
    // variants over several calls so each one is actually evaluated
    const invalidEntries = normalizeWeather(
      { ...base, images: [null, 'not-an-object', { key: 'UPPERCASE' }] },
      'metric',
    );
    expect(invalidEntries.images).to.deep.equal([]);
    const invalidKeys = normalizeWeather(
      { ...base, images: [{ key: '-starts-with-dash' }, { key: 42 }, { key: 'a'.repeat(40) }] },
      'metric',
    );
    expect(invalidKeys.images).to.deep.equal([]);
    const invalidLabels = normalizeWeather(
      {
        ...base,
        images: [
          { key: 'string-label', label: 'not-an-object' },
          { key: 'array-label', label: ['not-an-object'] },
          { key: 'empty-label', label: { en: '   ', veryverylonglanguage: 'dropped', fr: 42 } },
        ],
      },
      'metric',
    );
    // invalid labels never reject the image: the metadata degrades to the key
    expect(invalidLabels.images).to.deep.equal([
      { key: 'string-label' },
      { key: 'array-label' },
      { key: 'empty-label' },
    ]);
    const capped = normalizeWeather(
      {
        ...base,
        images: [{ key: 'one' }, { key: 'one' }, { key: 'two', label: { en: '  ', xx: 'kept' } }, { key: 'four' }],
      },
      'metric',
    );
    expect(capped.images).to.deep.equal([{ key: 'one' }, { key: 'two', label: { xx: 'kept' } }]);
  });
});

describe('externalIntegration.normalizeWeatherImage', () => {
  const pngBytes = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(16, 1)]);
  const jpegBytes = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(16, 1)]);

  it('should accept a PNG and return a data URI', () => {
    const image = normalizeWeatherImage(pngBytes.toString('base64'));
    expect(image).to.equal(`data:image/png;base64,${pngBytes.toString('base64')}`);
  });

  it('should accept a JPEG and return a data URI', () => {
    const image = normalizeWeatherImage(jpegBytes.toString('base64'));
    expect(image).to.equal(`data:image/jpeg;base64,${jpegBytes.toString('base64')}`);
  });

  it('should reject anything that is not a bounded PNG or JPEG', () => {
    expect(() => normalizeWeatherImage(undefined)).to.throw(ExternalIntegrationUnavailableError);
    expect(() => normalizeWeatherImage('')).to.throw(ExternalIntegrationUnavailableError);
    expect(() => normalizeWeatherImage('!!!!')).to.throw(ExternalIntegrationUnavailableError);
    // valid base64 of non-image bytes: magic numbers reject it
    expect(() => normalizeWeatherImage(Buffer.from('<svg onload=alert(1)>').toString('base64'))).to.throw(
      ExternalIntegrationUnavailableError,
    );
    // far over the 500 KB cap: the base64 length pre-check rejects it
    // before the decode allocates anything
    const bigPng = Buffer.concat([pngBytes, Buffer.alloc(MAX_WEATHER_IMAGE_BYTES)]);
    expect(() => normalizeWeatherImage(bigPng.toString('base64'))).to.throw(ExternalIntegrationUnavailableError);
    // one byte over the cap: short enough in base64 to pass the length
    // pre-check, rejected on the decoded size
    const barelyTooBigPng = Buffer.concat([pngBytes, Buffer.alloc(MAX_WEATHER_IMAGE_BYTES + 1 - pngBytes.length)]);
    expect(() => normalizeWeatherImage(barelyTooBigPng.toString('base64'))).to.throw(
      ExternalIntegrationUnavailableError,
    );
  });
});

describe('externalIntegration weather proxy getImage', () => {
  const pngBase64 = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(8, 2),
  ]).toString('base64');

  // dispatching sendCommand fake: the images the weather payload declares
  // are controlled per test through the returned `declared` array
  const buildImageSupervisor = async (declared) => {
    const { externalIntegration, stateManager } = buildSupervisor();
    const service = await seedWeatherService();
    externalIntegration.registerProxyService(service);
    externalIntegration.sendCommand = fake(async (targetService, type) => {
      if (type === WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.WEATHER_GET) {
        return {
          success: true,
          data: {
            weather: {
              temperature: 10,
              weather: 'rain',
              datetime: '2026-08-01T12:00:00.000Z',
              images: declared.map((key) => ({ key })),
            },
          },
        };
      }
      return { success: true, data: { image: pngBase64 } };
    });
    const proxyService = stateManager.get('service', service.name);
    return { externalIntegration, service, proxyService };
  };

  const GET_OPTIONS = { latitude: 48.85, longitude: 2.35, language: 'en', units: 'metric' };

  it('should relay weather.get-image for a declared key, validate the bytes and cache the result', async () => {
    const { externalIntegration, service, proxyService } = await buildImageSupervisor(['vigilance-map']);
    await proxyService.weather.get(GET_OPTIONS);
    const image = await proxyService.weather.getImage('vigilance-map');
    expect(image).to.equal(`data:image/png;base64,${pngBase64}`);
    sinonAssert.calledWith(
      externalIntegration.sendCommand,
      service,
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.WEATHER_GET_IMAGE,
      { key: 'vigilance-map' },
      { timeoutMs: WEATHER_GET_TIMEOUT_MS },
    );
    // second call within the TTL: served from cache, no new command
    // (one weather.get command + one weather.get-image command in total)
    const cachedImage = await proxyService.weather.getImage('vigilance-map');
    expect(cachedImage).to.equal(image);
    expect(externalIntegration.sendCommand.callCount).to.equal(2);
  });

  it('should only relay a key declared in the last weather payload', async () => {
    const { externalIntegration, proxyService } = await buildImageSupervisor(['vigilance-map']);
    // nothing declared yet (no weather.get ran): no command is sent at all
    await expect(proxyService.weather.getImage('vigilance-map')).to.be.rejectedWith(NotFoundError);
    expect(externalIntegration.sendCommand.callCount).to.equal(0);
    // declared: relayed
    await proxyService.weather.get(GET_OPTIONS);
    await proxyService.weather.getImage('vigilance-map');
    // an undeclared key is refused without reaching the integration
    await expect(proxyService.weather.getImage('rain-radar')).to.be.rejectedWith(NotFoundError);
    expect(externalIntegration.sendCommand.callCount).to.equal(2);
  });

  it('should stop serving a key the latest weather payload no longer declares', async () => {
    const declared = ['vigilance-map'];
    const { externalIntegration, proxyService } = await buildImageSupervisor(declared);
    await proxyService.weather.get(GET_OPTIONS);
    await proxyService.weather.getImage('vigilance-map');
    // the provider stops declaring the image: even the cached copy stops
    // being served — the declaration of the last payload is the truth
    declared.length = 0;
    await proxyService.weather.get(GET_OPTIONS);
    await expect(proxyService.weather.getImage('vigilance-map')).to.be.rejectedWith(NotFoundError);
    // two weather.get + one relayed get-image; the refused key costs none
    expect(externalIntegration.sendCommand.callCount).to.equal(3);
  });

  it('should reject an invalid image payload without caching it', async () => {
    const { externalIntegration, stateManager } = buildSupervisor();
    const service = await seedWeatherService();
    externalIntegration.registerProxyService(service);
    externalIntegration.sendCommand = fake(async (targetService, type) => {
      if (type === WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.WEATHER_GET) {
        return {
          success: true,
          data: {
            weather: {
              temperature: 10,
              weather: 'rain',
              datetime: '2026-08-01T12:00:00.000Z',
              images: [{ key: 'vigilance-map' }],
            },
          },
        };
      }
      return { success: true, data: { image: 'bm90LWFuLWltYWdl' } };
    });
    const proxyService = stateManager.get('service', service.name);
    await proxyService.weather.get(GET_OPTIONS);
    await expect(proxyService.weather.getImage('vigilance-map')).to.be.rejectedWith(
      ExternalIntegrationUnavailableError,
    );
    await expect(proxyService.weather.getImage('vigilance-map')).to.be.rejectedWith(
      ExternalIntegrationUnavailableError,
    );
    // one weather.get + two relayed get-image attempts, none cached
    expect(externalIntegration.sendCommand.callCount).to.equal(3);
  });
});
