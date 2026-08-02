const { expect } = require('chai');
const { assert: sinonAssert, fake } = require('sinon');

const { WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { ExternalIntegrationUnavailableError } = require('../../../utils/coreErrors');
const { normalizeWeather } = require('../../../lib/external-integration/externalIntegration.normalizeWeather');
const { WEATHER_GET_TIMEOUT_MS } = require('../../../lib/external-integration/constants');
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
        alerts: [{ severity: 'extreme', event: 'x'.repeat(500), description: 'y'.repeat(5000) }],
      },
      'metric',
    );
    expect(weather.alerts[0].event).to.have.lengthOf(100);
    expect(weather.alerts[0].description).to.have.lengthOf(2000);
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
