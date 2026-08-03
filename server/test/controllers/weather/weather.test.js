const { expect } = require('chai');
const { request, authenticatedRequest } = require('../request.test');

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
    await request
      .get('/api/v1/user/john/weather')
      .expect('Content-Type', /json/)
      .expect(401);
  });
});

describe('GET /api/v1/house/:selector/weather', () => {
  it('should return 400, house has no latitude/longitude specified', async () => {
    await authenticatedRequest
      .get('/api/v1/house/pepper-house/weather')
      .expect('Content-Type', /json/)
      .expect(400);
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
    await request
      .get('/api/v1/user/test-house/weather')
      .expect('Content-Type', /json/)
      .expect(401);
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
