const { expect } = require('chai');
const { authenticatedRequest } = require('../request.test');

describe('GET /api/v1/music/providers', () => {
  it('should get music providers list', async () => {
    await authenticatedRequest
      .get('/api/v1/music/providers')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body.providers[0]).to.be.equals('provider1');
        expect(res.body.providers[1]).to.be.equals('provider2');
      });
  });
});

describe('GET /api/v1/music/:service_name', () => {
  it('should get music provider status', async () => {
    await authenticatedRequest
      .get('/api/v1/music/provider1')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body.status).to.be.equals('ENABLED');
      });
  });
});

describe('GET /api/v1/music/pause/:provider/:speaker_output_name', () => {
  it('should pause music for specific provider and speaker', async () => {
    await authenticatedRequest
      .get('/api/v1/music/pause/provider1/default')
      .expect('Content-Type', /json/)
      .expect(200);
  });
});

describe('GET /api/v1/music/mute/:provider/:speaker_output_name', () => {
  it('should mute music for specific provider and speaker', async () => {
    await authenticatedRequest
      .get('/api/v1/music/mute/provider1/default')
      .expect('Content-Type', /json/)
      .expect(200);
  });
});

describe('GET /api/v1/music/volume/:provider/:speaker_output_name', () => {
  it('should set volume music for specific provider and speaker', async () => {
    await authenticatedRequest
      .get('/api/v1/music/volume/provider1/default/0.8')
      .expect('Content-Type', /json/)
      .expect(200);
  });
});

describe('GET /api/v1/music/stop/:provider/:speaker_output_name', () => {
  it('should stop music for specific provider and speaker', async () => {
    await authenticatedRequest
      .get('/api/v1/music/stop/provider1/default')
      .expect('Content-Type', /json/)
      .expect(200);
  });
});

describe('POST /api/v1/music/:service_name/:status', () => {
  it('should revoke session', async () => {
    await authenticatedRequest
      .post('/api/v1/music/provider1/ENABLED')
      .expect('Content-Type', /json/)
      .expect(200);
  });
});
