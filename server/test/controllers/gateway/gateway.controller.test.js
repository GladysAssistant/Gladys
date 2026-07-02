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

describe('POST /api/v1/gateway/aichat/chat', () => {
  it('should return AI chat response', async () => {
    nock(config.gladysGatewayServerUrl)
      .post('/openai/ask')
      .reply(200, {
        choices: [
          {
            message: {
              content: 'this is my answer',
            },
          },
        ],
      });
    const response = await authenticatedRequest
      .post('/api/v1/gateway/aichat/chat')
      .send({
        messages: [{ role: 'user', content: 'hello' }],
        tools: [],
        tool_choice: 'auto',
      })
      .expect('Content-Type', /json/)
      .expect(200);
    expect(response.body).to.deep.equal({
      choices: [
        {
          message: {
            content: 'this is my answer',
          },
        },
      ],
    });
  });
});

describe('GET /api/v1/gateway/aichat/debug-context', () => {
  beforeEach(() => {
    global.TEST_GLADYS_INSTANCE.stateManager.setState('service', 'mcp', {
      mcpHandler: {
        getAllTools: async () => [],
      },
    });
  });

  it('should return AI chat debug context', async () => {
    const response = await authenticatedRequest
      .get('/api/v1/gateway/aichat/debug-context')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).to.have.property('messages');
    expect(response.body).to.have.property('tools');
    expect(response.body.tool_choice).to.equal('auto');
    // eslint-disable-next-line no-underscore-dangle
    expect(response.body._debug).to.have.property('generatedAt');
    expect(response.body.messages[0].role).to.equal('system');
  });
});

describe('POST /api/v1/gateway/stt', () => {
  it('should return stt response', async () => {
    nock(config.gladysGatewayServerUrl)
      .post('/stt')
      .reply(200, { text: 'bonjour gladys' });
    const response = await authenticatedRequest
      .post('/api/v1/gateway/stt')
      .set('Content-Type', 'audio/webm')
      .send(Buffer.from('fake-audio'))
      .expect('Content-Type', /json/)
      .expect(200);
    expect(response.body).to.deep.equal({ text: 'bonjour gladys' });
  });

  it('should return 400 when audio body is empty', async () => {
    await authenticatedRequest
      .post('/api/v1/gateway/stt')
      .set('Content-Type', 'audio/webm')
      .send(Buffer.alloc(0))
      .expect(400);
  });
});

describe('POST /api/v1/gateway/voice', () => {
  beforeEach(() => {
    global.TEST_GLADYS_INSTANCE.stateManager.setState('service', 'mcp', {
      mcpHandler: {
        getAllTools: async () => [],
      },
    });
  });

  it('should process voice message end-to-end', async () => {
    nock(config.gladysGatewayServerUrl)
      .post('/stt')
      .reply(200, { text: 'allume la lumière' });
    nock(config.gladysGatewayServerUrl)
      .post('/openai/ask')
      .reply(200, {
        choices: [
          {
            message: {
              content: 'La lumière est allumée.',
            },
          },
        ],
      });
    nock(config.gladysGatewayServerUrl)
      .post('/tts/token')
      .reply(200, { url: 'http://tts.test/audio.mp3' });

    const response = await authenticatedRequest
      .post('/api/v1/gateway/voice')
      .set('Content-Type', 'audio/wav')
      .send(Buffer.from('fake-audio'))
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).to.deep.equal({
      transcription: 'allume la lumière',
      answer: 'La lumière est allumée.',
      ttsUrl: 'http://tts.test/audio.mp3',
    });
  });

  it('should return 400 when audio body is empty', async () => {
    await authenticatedRequest
      .post('/api/v1/gateway/voice')
      .set('Content-Type', 'audio/webm')
      .send(Buffer.alloc(0))
      .expect(400);
  });
});

describe('POST /api/v1/gateway/refresh-latest-gladys-version', () => {
  it('should refresh latest gladys version', async () => {
    nock(config.gladysGatewayServerUrl)
      .post('/v1/api/gladys/version', (body) => true)
      .reply(200, {
        name: 'v4.56.1',
        created_at: '2025-03-31T08:17:48.202Z',
      });
    const response = await authenticatedRequest
      .post('/api/v1/gateway/refresh-latest-gladys-version')
      .expect('Content-Type', /json/)
      .expect(200);
    expect(response.body).to.have.property('message', 'Refresh finished');
  });
});
