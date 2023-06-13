const nock = require('nock');
const { expect } = require('chai');
const getConfig = require('../../../utils/getConfig');
const { authenticatedRequest } = require('../request.test');

const config = getConfig();

describe('GET /api/v1/gateway/backup', () => {
  it('should get backups', async () => {
    const backups = [
      {
        id: '8d43a8f0-09e7-48e9-a619-824a45707c26',
        account_id: 'f4fd09b6-eeef-4439-95db-ef7a37443757',
        path: 'http://backup.com',
        size: 37680,
        created_at: '2019-06-10T07:01:24.846Z',
        updated_at: '2019-06-10T07:01:24.846Z',
        is_deleted: false,
      },
    ];
    nock(config.gladysGatewayServerUrl)
      .get('/backups')
      .reply(200, backups);
    await authenticatedRequest
      .get('/api/v1/gateway/backup')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal(backups);
      });
  });
});

describe('GET /api/v1/gateway/key', () => {
  it('should get users keys', async () => {
    const users = [
      {
        id: '9233e553-90a0-4d04-9d69-f38fb8ccbc72',
        name: 'User 2',
        rsa_public_key:
          '51:89:e6:91:4f:da:f8:d6:b6:f6:1e:15:54:c4:c0:fd:cc:69:70:81:d4:a8:ea:26:8b:02:4b:b9:ff:97:64:1a',
        ecdsa_public_key:
          '2e:e9:ee:a0:b3:22:46:62:f8:22:9b:52:9d:f4:3f:65:70:62:59:76:d1:85:ad:3b:9f:65:4e:61:4c:26:89:7e',
        connected: false,
      },
    ];
    nock(config.gladysGatewayServerUrl)
      .get('/instances/users')
      .reply(200, users);
    await authenticatedRequest
      .get('/api/v1/gateway/key')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.instanceOf(Array);
        res.body.forEach((user) => {
          expect(user).to.have.property('accepted');
        });
      });
  });
});

describe('GET /api/v1/gateway/status', () => {
  it('should get gateway status', async () => {
    await authenticatedRequest
      .get('/api/v1/gateway/status')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('connected');
        expect(res.body).to.have.property('configured');
      });
  });
});

describe('POST /api/v1/gateway/logout', () => {
  it('should disconnect gateway', async () => {
    await authenticatedRequest
      .post('/api/v1/gateway/logout')
      .expect('Content-Type', /json/)
      .expect(200);
  });
});

describe('GET /api/v1/gateway/instance/key', () => {
  it('should get instance keys', async () => {
    await authenticatedRequest
      .get('/api/v1/gateway/instance/key')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('rsa_fingerprint');
        expect(res.body).to.have.property('ecdsa_fingerprint');
      });
  });
});

describe('GET /api/v1/gateway/backup/restore/status', () => {
  it('should get restore status', async () => {
    await authenticatedRequest
      .get('/api/v1/gateway/backup/restore/status')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('restore_in_progress');
      });
  });
});

describe('POST /api/v1/gateway/openai/ask', () => {
  it('should return GPT-3 response', async () => {
    nock(config.gladysGatewayServerUrl)
      .post('/openai/ask')
      .reply(200, {
        answer: 'this is my answer',
      });
    const response = await authenticatedRequest
      .post('/api/v1/gateway/openai/ask')
      .expect('Content-Type', /json/)
      .expect(200);
    expect(response.body).to.have.property('answer', 'this is my answer');
  });
});
