const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const db = require('../../../models');
const {
  authenticatedRequest,
  nonAdminRequest,
  NON_ADMIN_USER_ID,
  request: unAuthenticatedRequest,
} = require('../request.test');
const { SYSTEM_VARIABLE_NAMES, USER_ROLE } = require('../../../utils/constants');

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

describe('TTS API', () => {
  let gladys;

  beforeEach(() => {
    // @ts-ignore
    gladys = global.TEST_GLADYS_INSTANCE;
  });

  afterEach(() => {
    gladys.stateManager.deleteState('service', 'ext-piper-tts');
    gladys.tts.audios.clear();
  });

  describe('GET /api/v1/tts/provider', () => {
    it('should return the default configuration', async () => {
      const res = await authenticatedRequest
        .get('/api/v1/tts/provider')
        .expect('Content-Type', /json/)
        .expect(200);
      expect(res.body).to.deep.equal({
        active: 'gladys-plus',
        providers: [{ provider: 'gladys-plus', name: 'Gladys Plus' }],
      });
    });

    it('should list registered TTS provider services, readable by a non-admin', async () => {
      await seedNonAdminUser();
      gladys.stateManager.setState('service', 'ext-piper-tts', { tts: { synthesize: fake.resolves(null) } });
      const res = await nonAdminRequest
        .get('/api/v1/tts/provider')
        .expect('Content-Type', /json/)
        .expect(200);
      expect(res.body.providers).to.deep.equal([
        { provider: 'gladys-plus', name: 'Gladys Plus' },
        // no installed t_service row in this test: raw selector fallback
        { provider: 'ext-piper-tts', name: 'ext-piper-tts' },
      ]);
    });
  });

  describe('POST /api/v1/tts/provider', () => {
    it('should set the active provider and return the new configuration', async () => {
      gladys.stateManager.setState('service', 'ext-piper-tts', { tts: { synthesize: fake.resolves(null) } });
      const res = await authenticatedRequest
        .post('/api/v1/tts/provider')
        .send({ provider: 'ext-piper-tts' })
        .expect('Content-Type', /json/)
        .expect(200);
      expect(res.body.active).to.equal('ext-piper-tts');
      const saved = await gladys.variable.getValue(SYSTEM_VARIABLE_NAMES.TTS_ACTIVE_PROVIDER);
      expect(saved).to.equal('ext-piper-tts');
    });

    it('should refuse an unavailable provider with a 422', async () => {
      await authenticatedRequest
        .post('/api/v1/tts/provider')
        .send({ provider: 'ext-gone-tts' })
        .expect(422);
    });

    it('should refuse a non-admin user with a 403', async () => {
      await seedNonAdminUser();
      await nonAdminRequest
        .post('/api/v1/tts/provider')
        .send({ provider: 'gladys-plus' })
        .expect(403);
    });
  });

  describe('GET /api/v1/tts/audio/:token', () => {
    it('should serve the clip unauthenticated, with its content type', async () => {
      gladys.tts.audios.set('a'.repeat(64), {
        buffer: Buffer.from('fake-mp3-bytes'),
        contentType: 'audio/mpeg',
        expiresAt: Date.now() + 60 * 1000,
      });
      const res = await unAuthenticatedRequest
        .get(`/api/v1/tts/audio/${'a'.repeat(64)}.mp3`)
        .buffer(true)
        .parse((response, callback) => {
          const chunks = [];
          response.on('data', (chunk) => chunks.push(chunk));
          response.on('end', () => callback(null, Buffer.concat(chunks)));
        })
        .expect('Content-Type', /audio\/mpeg/)
        .expect(200);
      expect(res.body.equals(Buffer.from('fake-mp3-bytes'))).to.equal(true);
    });

    it('should return 404 on an unknown or expired token', async () => {
      await unAuthenticatedRequest.get('/api/v1/tts/audio/unknown-token.mp3').expect(404);
      gladys.tts.audios.set('expired-token', {
        buffer: Buffer.from('old'),
        contentType: 'audio/mpeg',
        expiresAt: Date.now() - 1,
      });
      await unAuthenticatedRequest.get('/api/v1/tts/audio/expired-token.mp3').expect(404);
    });
  });
});
