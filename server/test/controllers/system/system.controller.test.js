const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const db = require('../../../models');
const { USER_ROLE } = require('../../../utils/constants');
const { authenticatedRequest, nonAdminRequest, NON_ADMIN_USER_ID } = require('../request.test');

const seedNonAdminUser = () =>
  db.User.create({
    id: NON_ADMIN_USER_ID,
    firstname: 'Pepper',
    lastname: 'Potts',
    selector: 'pepper-habitant',
    email: 'pepper-habitant@pots.com',
    password: 'mysuperpassword',
    role: USER_ROLE.HABITANT,
    language: 'en',
    birthdate: '1990-12-12',
  });

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

describe('GET /api/v1/system/clock', () => {
  it('should return the current time of the server', async () => {
    const before = Date.now();
    await authenticatedRequest
      .get('/api/v1/system/clock')
      .expect('Content-Type', /json/)
      .expect('Cache-Control', 'no-store')
      .expect(200)
      .then((res) => {
        const serverTime = Date.parse(res.body.server_time);
        expect(serverTime).to.be.at.least(before);
        expect(serverTime).to.be.at.most(Date.now());
      });
  });
});

describe('GET /api/v1/system/clock/sync', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should return the network time synchronization status of the host', async () => {
    const status = { available: true, can_ntp: true, ntp_enabled: false, ntp_synchronized: false };
    const getTimeSyncStatus = sinon.stub(global.TEST_GLADYS_INSTANCE.system, 'getTimeSyncStatus').resolves(status);
    await authenticatedRequest
      .get('/api/v1/system/clock/sync')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal(status);
      });
    sinon.assert.calledOnceWithExactly(getTimeSyncStatus, { refresh: false });
  });

  it('should read the status again when asked to refresh it', async () => {
    const status = { available: true, can_ntp: true, ntp_enabled: true, ntp_synchronized: true };
    const getTimeSyncStatus = sinon.stub(global.TEST_GLADYS_INSTANCE.system, 'getTimeSyncStatus').resolves(status);
    await authenticatedRequest.get('/api/v1/system/clock/sync?refresh=true').expect(200);
    sinon.assert.calledOnceWithExactly(getTimeSyncStatus, { refresh: true });
  });

  it('should be reserved to admins', async () => {
    await seedNonAdminUser();
    const getTimeSyncStatus = sinon.stub(global.TEST_GLADYS_INSTANCE.system, 'getTimeSyncStatus');
    await nonAdminRequest.get('/api/v1/system/clock/sync').expect(403);
    sinon.assert.notCalled(getTimeSyncStatus);
  });
});

describe('POST /api/v1/system/clock/sync', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should turn on the network time synchronization of the host', async () => {
    const status = { available: true, can_ntp: true, ntp_enabled: true, ntp_synchronized: false };
    const enableTimeSync = sinon.stub(global.TEST_GLADYS_INSTANCE.system, 'enableTimeSync').resolves(status);
    await authenticatedRequest
      .post('/api/v1/system/clock/sync')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal(status);
      });
    sinon.assert.calledOnce(enableTimeSync);
  });

  it('should be reserved to admins', async () => {
    await seedNonAdminUser();
    const enableTimeSync = sinon.stub(global.TEST_GLADYS_INSTANCE.system, 'enableTimeSync');
    await nonAdminRequest.post('/api/v1/system/clock/sync').expect(403);
    sinon.assert.notCalled(enableTimeSync);
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
