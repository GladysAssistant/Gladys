const { expect } = require('chai');
const { authenticatedRequest } = require('../request.test');

describe('GET /api/v1/system/info', () => {
  it('should return system infos', async () => {
    await authenticatedRequest
      .get('/api/v1/system/info')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('platform');
        expect(res.body).to.have.property('nodejs_version');
      });
  });
});

describe('GET /api/v1/system/disk', () => {
  it('should return disk usage', async () => {
    await authenticatedRequest
      .get('/api/v1/system/disk')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('filesystem');
        expect(res.body).to.have.property('capacity');
      });
  });
});

describe('POST /api/v1/system/vacuum', () => {
  it('should vacuum database', async () => {
    await authenticatedRequest
      .post('/api/v1/system/vacuum')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property('message');
      });
  });
});
