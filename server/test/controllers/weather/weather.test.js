const { expect } = require('chai');
const { request, authenticatedRequest } = require('../request.test');
const db = require('../../../models');

describe('GET /api/v1/user/:selector/weather', () => {
  it('should return the weather where the user is', async () => {
    await authenticatedRequest
      .get('/api/v1/user/john/weather')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({
          temperature: 54.87,
          humidity: 0.76,
          pressure: 1019.4,
          datetime: '2019-03-28T07:50:18.000Z',
          units: 'metric',
          wind_speed: 5.25,
          weather: 'cloud',
        });
      });
  });
  it('should return 401 unauthorized', async () => {
    await request.get('/api/v1/user/john/weather').expect('Content-Type', /json/).expect(401);
  });
});

describe('GET /api/v1/house/:selector/weather', () => {
  it('should return 400, house has no latitude/longitude specified', async () => {
    await authenticatedRequest.get('/api/v1/house/pepper-house/weather').expect('Content-Type', /json/).expect(400);
  });
  it('should return weather where house is', async () => {
    await authenticatedRequest
      .get('/api/v1/house/test-house/weather')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({
          temperature: 54.87,
          humidity: 0.76,
          pressure: 1019.4,
          datetime: '2019-03-28T07:50:18.000Z',
          units: 'metric',
          wind_speed: 5.25,
          weather: 'cloud',
          house: {
            id: 'a741dfa6-24de-4b46-afc7-370772f068d5',
            name: 'Test house',
            selector: 'test-house',
            alarm_code: null,
            alarm_delay_before_arming: 10,
            alarm_mode: 'disarmed',
            latitude: 12,
            longitude: 12,
            created_at: '2019-02-12T07:49:07.556Z',
            updated_at: '2019-02-12T07:49:07.556Z',
          },
          options: { latitude: 12, longitude: 12, language: 'en', units: 'metric' },
        });
      });
  });
  it('should return 401 unauthorized', async () => {
    await request.get('/api/v1/user/test-house/weather').expect('Content-Type', /json/).expect(401);
  });
  it('should return 400 service not configured when the pinned provider is gone', async () => {
    await authenticatedRequest
      .get('/api/v1/house/test-house/weather')
      .query({ service: 'ext-uninstalled-provider' })
      .expect('Content-Type', /json/)
      .expect(400)
      .then((res) => {
        expect(res.body.message).to.equal('SERVICE_NOT_CONFIGURED');
      });
  });
});

describe('GET /api/v1/weather/provider', () => {
  const EXT_PROVIDER_NAME = 'ext-fake-weather-provider';
  afterEach(() => {
    // eslint-disable-next-line no-undef
    TEST_GLADYS_INSTANCE.stateManager.deleteState('service', EXT_PROVIDER_NAME);
  });
  it('should list the available weather providers with their manifest label', async () => {
    // an installed external weather integration: proxy in the
    // stateManager + its t_service row carrying the display name
    // eslint-disable-next-line no-undef
    TEST_GLADYS_INSTANCE.stateManager.setState('service', EXT_PROVIDER_NAME, {
      weather: { get: () => Promise.resolve({}) },
    });
    await db.Service.create({
      name: EXT_PROVIDER_NAME,
      selector: EXT_PROVIDER_NAME,
      version: '1.0.0',
      status: 'RUNNING',
      type: 'external',
      docker_image: 'ghcr.io/john/gladys-fake-weather:1.0.0',
      manifest: { manifest_version: 1, type: 'weather', name: 'Fake Weather' },
    });
    await authenticatedRequest
      .get('/api/v1/weather/provider')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.an('array');
        const openweather = res.body.find((provider) => provider.service_name === 'openweather');
        expect(openweather).to.deep.equal({ service_name: 'openweather', label: null });
        const external = res.body.find((provider) => provider.service_name === EXT_PROVIDER_NAME);
        expect(external).to.deep.equal({ service_name: EXT_PROVIDER_NAME, label: 'Fake Weather' });
        // precedence order: the external provider comes first
        expect(res.body.indexOf(external)).to.be.below(res.body.indexOf(openweather));
      });
  });
  it('should return 401 unauthorized', async () => {
    await request.get('/api/v1/weather/provider').expect('Content-Type', /json/).expect(401);
  });
});

describe('GET /api/v1/house/:selector/weather/image/:image_key', () => {
  const FAKE_PROVIDER_NAME = 'ext-fake-weather-images';
  afterEach(() => {
    // eslint-disable-next-line no-undef
    TEST_GLADYS_INSTANCE.stateManager.deleteState('service', FAKE_PROVIDER_NAME);
  });
  it('should return the provider image', async () => {
    // eslint-disable-next-line no-undef
    TEST_GLADYS_INSTANCE.stateManager.setState('service', FAKE_PROVIDER_NAME, {
      weather: {
        get: () => Promise.resolve({}),
        getImage: () => Promise.resolve('data:image/png;base64,ok'),
      },
    });
    await authenticatedRequest
      .get('/api/v1/house/test-house/weather/image/vigilance-map')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({ image: 'data:image/png;base64,ok' });
      });
  });
  it('should only use the pinned provider when ?service is set', async () => {
    const OTHER_PROVIDER_NAME = 'ext-other-weather-images';
    // eslint-disable-next-line no-undef
    TEST_GLADYS_INSTANCE.stateManager.setState('service', FAKE_PROVIDER_NAME, {
      weather: {
        get: () => Promise.resolve({}),
        getImage: () => Promise.resolve('data:image/png;base64,first'),
      },
    });
    // eslint-disable-next-line no-undef
    TEST_GLADYS_INSTANCE.stateManager.setState('service', OTHER_PROVIDER_NAME, {
      weather: {
        get: () => Promise.resolve({}),
        getImage: () => Promise.resolve('data:image/png;base64,other'),
      },
    });
    try {
      await authenticatedRequest
        .get('/api/v1/house/test-house/weather/image/vigilance-map')
        .query({ service: OTHER_PROVIDER_NAME })
        .expect('Content-Type', /json/)
        .expect(200)
        .then((res) => {
          expect(res.body).to.deep.equal({ image: 'data:image/png;base64,other' });
        });
    } finally {
      // eslint-disable-next-line no-undef
      TEST_GLADYS_INSTANCE.stateManager.deleteState('service', OTHER_PROVIDER_NAME);
    }
  });
  it('should return 404 when no provider serves images', async () => {
    await authenticatedRequest
      .get('/api/v1/house/test-house/weather/image/vigilance-map')
      .expect('Content-Type', /json/)
      .expect(404);
  });
  it('should return 404 on an unknown house', async () => {
    await authenticatedRequest
      .get('/api/v1/house/unknown-house/weather/image/vigilance-map')
      .expect('Content-Type', /json/)
      .expect(404);
  });
  it('should return 401 unauthorized', async () => {
    await request
      .get('/api/v1/house/test-house/weather/image/vigilance-map')
      .expect('Content-Type', /json/)
      .expect(401);
  });
});
