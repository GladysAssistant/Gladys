const { expect } = require('chai');
const { authenticatedRequest, request } = require('../request.test');

describe('Gladys Plus restore routes when instance is not configured', () => {
  let previousUserState;
  beforeEach(() => {
    // @ts-ignore
    previousUserState = global.TEST_GLADYS_INSTANCE.stateManager.state.user;
    // @ts-ignore
    global.TEST_GLADYS_INSTANCE.stateManager.state.user = {};
  });
  afterEach(() => {
    // @ts-ignore
    global.TEST_GLADYS_INSTANCE.stateManager.state.user = previousUserState;
  });
  it('should return gateway status without authentication', async () => {
    await request
      .get('/api/v1/gateway/status')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('connected');
        expect(res.body).to.have.property('configured');
      });
  });
  it('should save backup key without authentication', async () => {
    await request
      .post('/api/v1/gateway/backup-key')
      .send({
        backup_key: 'my-super-backup-key',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({ success: true });
      });
    // @ts-ignore
    const backupKey = await global.TEST_GLADYS_INSTANCE.variable.getValue('GLADYS_GATEWAY_BACKUP_KEY');
    expect(backupKey).to.equal('my-super-backup-key');
  });
  it('should return 400 when the backup key is missing', async () => {
    await request
      .post('/api/v1/gateway/backup-key')
      .send({})
      .expect('Content-Type', /json/)
      .expect(400);
  });
  it('should return restore status without authentication', async () => {
    await request
      .get('/api/v1/gateway/backup/restore/status')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('restore_in_progress', false);
        expect(res.body).to.have.property('restore_errored', false);
      });
  });
});

describe('Gladys Plus restore routes when instance is configured', () => {
  it('should return 401 on gateway status without authentication', async () => {
    await request.get('/api/v1/gateway/status').expect(401);
  });
  it('should return 401 on backup key without authentication', async () => {
    await request
      .post('/api/v1/gateway/backup-key')
      .send({
        backup_key: 'my-super-backup-key',
      })
      .expect(401);
  });
  it('should return 401 on restore status without authentication', async () => {
    await request.get('/api/v1/gateway/backup/restore/status').expect(401);
  });
  it('should save backup key with an authenticated admin', async () => {
    await authenticatedRequest
      .post('/api/v1/gateway/backup-key')
      .send({
        backup_key: 'my-super-backup-key',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({ success: true });
      });
  });
});
