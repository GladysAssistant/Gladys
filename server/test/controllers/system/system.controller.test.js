const { expect } = require('chai');
const sinon = require('sinon');

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

describe('POST /api/v1/system/upgrade', () => {
  it('should upgrade', async () => {
    const res = await authenticatedRequest
      .post('/api/v1/system/upgrade')
      .expect('Content-Type', /json/)
      .expect(200);
    expect(res.body).to.have.property('success', true);
    expect(res.body).to.have.property('message');
  });
});

describe('GET /api/v1/system/logs', () => {
  const logsResponse = {
    size: 12,
    offset: 0,
    length: 6,
    encoding: 'base64',
    content_base64: 'bGluZTEK',
  };
  let getGladysLogsStub;

  beforeEach(() => {
    getGladysLogsStub = sinon.stub(global.TEST_GLADYS_INSTANCE.system, 'getGladysLogs').resolves(logsResponse);
  });

  afterEach(() => {
    getGladysLogsStub.restore();
  });

  it('should return logs chunk with default query params', async () => {
    await authenticatedRequest
      .get('/api/v1/system/logs')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal(logsResponse);
      });
    sinon.assert.calledWith(getGladysLogsStub, { offset: 0, limit: undefined, refresh: false });
  });

  it('should parse offset, limit and refresh query params', async () => {
    await authenticatedRequest
      .get('/api/v1/system/logs')
      .query({ offset: '6', limit: '1024', refresh: 'true' })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal(logsResponse);
      });
    sinon.assert.calledWith(getGladysLogsStub, { offset: 6, limit: 1024, refresh: true });
  });
});
