const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

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

describe('POST /api/v1/system/reboot', () => {
  let rebootHostStub;

  beforeEach(() => {
    rebootHostStub = sinon.stub(global.TEST_GLADYS_INSTANCE.system, 'rebootHost');
  });

  afterEach(() => {
    rebootHostStub.restore();
  });

  it('should reboot the host', async () => {
    rebootHostStub.resolves(null);
    await authenticatedRequest
      .post('/api/v1/system/reboot')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property('message');
      });
    sinon.assert.calledOnce(rebootHostStub);
  });

  it('should return an error when the reboot command fails immediately', async () => {
    // A destructive action must not report a success it did not get: an
    // immediate failure (polkit refusal, helper error) is surfaced to the user.
    rebootHostStub.rejects(new Error('dbus-send not found'));
    await authenticatedRequest
      .post('/api/v1/system/reboot')
      .expect('Content-Type', /json/)
      .expect(500);
    sinon.assert.calledOnce(rebootHostStub);
  });

  it('should acknowledge (200) when the command does not fail quickly', async function Test() {
    this.timeout(6000);
    // The host goes down before the command resolves: acknowledge instead of
    // keeping the request open until the connection drops.
    rebootHostStub.returns(new Promise(() => {}));
    await authenticatedRequest
      .post('/api/v1/system/reboot')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('success', true);
      });
    sinon.assert.calledOnce(rebootHostStub);
  });
});

describe('POST /api/v1/system/shutdown-host', () => {
  let shutdownHostStub;

  beforeEach(() => {
    shutdownHostStub = sinon.stub(global.TEST_GLADYS_INSTANCE.system, 'shutdownHost');
  });

  afterEach(() => {
    shutdownHostStub.restore();
  });

  it('should shutdown the host', async () => {
    shutdownHostStub.resolves(null);
    await authenticatedRequest
      .post('/api/v1/system/shutdown-host')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property('message');
      });
    sinon.assert.calledOnce(shutdownHostStub);
  });

  it('should return an error when the shutdown command fails immediately', async () => {
    shutdownHostStub.rejects(new Error('dbus-send not found'));
    await authenticatedRequest
      .post('/api/v1/system/shutdown-host')
      .expect('Content-Type', /json/)
      .expect(500);
    sinon.assert.calledOnce(shutdownHostStub);
  });

  it('should acknowledge (200) when the command does not fail quickly', async function Test() {
    this.timeout(6000);
    shutdownHostStub.returns(new Promise(() => {}));
    await authenticatedRequest
      .post('/api/v1/system/shutdown-host')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('success', true);
      });
    sinon.assert.calledOnce(shutdownHostStub);
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
