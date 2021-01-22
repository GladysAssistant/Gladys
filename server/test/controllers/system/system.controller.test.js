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

describe('GET /api/v1/system/container', () => {
  it('should return infos container', async () => {
    await authenticatedRequest
      .get('/api/v1/system/container')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('name');
        expect(res.body).to.have.property('state');
      });
  });
});

describe('GET /api/v1/system/upgrade/download', () => {
  it('should return infos download', async () => {
    await authenticatedRequest
      .get('/api/v1/system/upgrade/download')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('success');
        expect(res.body).to.have.property('message');
      });
  });
});

describe('GET /api/v1/system/upgrade/download/status', () => {
  it('should return infos upgrade', async () => {
    await authenticatedRequest
      .get('/api/v1/system/upgrade/download/status')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('error');
        expect(res.body).to.have.property('upgrade_finished');
        expect(res.body).to.have.property('last_event');
      });
  });
});

describe('GET /api/v1/system/shutdown', () => {
  it('should return system will shutdown soon', async () => {
    await authenticatedRequest
      .get('/api/v1/system/shutdown')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('success');
        expect(res.body).to.have.property('message');
      });
  });
});
