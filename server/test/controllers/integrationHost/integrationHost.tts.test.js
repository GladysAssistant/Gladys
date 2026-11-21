const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const db = require('../../../models');
const { generateIntegrationToken } = require('../../../utils/integrationToken');
const { SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');
const { Error403 } = require('../../../utils/httpErrors');
const { MAX_TTS_SPEECH_URLS_PER_MINUTE } = require('../../../lib/external-integration/constants');

// a device integration driving its own speaker (the Karotz case): no
// manifest flag is needed to ask for a clip of the instance's voice
const SPEAKER_MANIFEST = {
  manifest_version: 1,
  type: 'device',
  name: 'Rabbit Demo',
  description: { en: 'Speaking rabbit demo integration.' },
  version: '1.0.0',
  docker_image: 'ghcr.io/john/gladys-rabbit-demo:1.0.0',
  gladys_version: '>=0.1.0',
};

const seedService = async () =>
  (
    await db.Service.create({
      name: 'ext-dev-rabbit-demo',
      selector: 'ext-dev-rabbit-demo',
      version: '1.0.0',
      status: 'RUNNING',
      type: 'external',
      docker_image: SPEAKER_MANIFEST.docker_image,
      manifest: SPEAKER_MANIFEST,
      token_version: 1,
    })
  ).get({ plain: true });

const speechUrlRequest = (token) =>
  // @ts-ignore
  request(TEST_BACKEND_APP)
    .post('/api/integration/v1/tts/speech_url')
    .set('Accept', 'application/json')
    .set('Authorization', `Bearer ${token}`);

describe('Integration host API: POST /api/integration/v1/tts/speech_url', () => {
  let gladys;
  let service;
  let token;

  beforeEach(async () => {
    // @ts-ignore
    gladys = global.TEST_GLADYS_INSTANCE;
    service = await seedService();
    token = generateIntegrationToken(service.id, 1, 'secret');
  });

  afterEach(() => {
    sinon.restore();
    gladys.stateManager.deleteState('service', 'ext-piper-tts');
    gladys.tts.audios.clear();
    gladys.externalIntegration.speechUrlRateLimits.clear();
  });

  it('should return 401 without the integration token', async () => {
    // @ts-ignore
    await request(TEST_BACKEND_APP)
      .post('/api/integration/v1/tts/speech_url')
      .send({ text: 'Bonjour !' })
      .expect(401);
  });

  it('should return the signed Gladys Plus URL when Gladys Plus is the voice', async () => {
    sinon.stub(gladys.gateway, 'getTTSApiUrl').resolves({ url: 'https://plus.test/tts/signed.mp3' });
    const res = await speechUrlRequest(token)
      .send({ text: 'Bonjour !', language: 'fr' })
      .expect('Content-Type', /json/)
      .expect(200);
    expect(res.body).to.deep.equal({ url: 'https://plus.test/tts/signed.mp3' });
    sinon.assert.calledOnceWithExactly(gladys.gateway.getTTSApiUrl, { text: 'Bonjour !' });
  });

  it('should return a LAN URL whose clip the player fetches unauthenticated, with an integration provider', async () => {
    const synthesize = fake.resolves({
      buffer: Buffer.from('fake-mp3-bytes'),
      contentType: 'audio/mpeg',
      extension: 'mp3',
    });
    gladys.stateManager.setState('service', 'ext-piper-tts', { tts: { synthesize } });
    await gladys.variable.setValue(SYSTEM_VARIABLE_NAMES.TTS_ACTIVE_PROVIDER, 'ext-piper-tts');
    const res = await speechUrlRequest(token)
      .send({ text: 'Bonjour !', language: 'fr' })
      .expect(200);
    sinon.assert.calledOnceWithExactly(synthesize, { text: 'Bonjour !', language: 'fr' });
    expect(Object.keys(res.body)).to.deep.equal(['url']);
    const { pathname, protocol } = new URL(res.body.url);
    expect(protocol).to.equal('http:');
    expect(pathname).to.match(/^\/api\/v1\/tts\/audio\/[0-9a-f]{64}\.mp3$/);
    // the URL is what a speaker fetches: no JWT, the token is the secret
    // @ts-ignore
    const clip = await request(TEST_BACKEND_APP)
      .get(pathname)
      .buffer(true)
      .parse((response, callback) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => callback(null, Buffer.concat(chunks)));
      })
      .expect('Content-Type', /audio\/mpeg/)
      .expect(200);
    expect(clip.body.equals(Buffer.from('fake-mp3-bytes'))).to.equal(true);
  });

  it('should answer 400 on a blank or oversized text', async () => {
    await speechUrlRequest(token)
      .send({ text: '   ' })
      .expect(400);
    await speechUrlRequest(token)
      .send({ text: 'a'.repeat(2001) })
      .expect(400);
    await speechUrlRequest(token)
      .send({ text: 'Bonjour', language: 'not a language' })
      .expect(400);
  });

  it('should answer 503 TTS_UNAVAILABLE, not the Gladys Plus 403, when the instance has no subscription', async () => {
    sinon.stub(gladys.gateway, 'getTTSApiUrl').rejects(new Error403('NO_TTS_ACCESS'));
    const res = await speechUrlRequest(token)
      .send({ text: 'Bonjour !' })
      .expect(503);
    expect(res.body).to.include({ status: 503, code: 'SERVICE_UNAVAILABLE', message: 'TTS_UNAVAILABLE' });
  });

  it('should answer 503 TTS_UNAVAILABLE when the selected provider is not running', async () => {
    await gladys.variable.setValue(SYSTEM_VARIABLE_NAMES.TTS_ACTIVE_PROVIDER, 'ext-piper-tts');
    const res = await speechUrlRequest(token)
      .send({ text: 'Bonjour !' })
      .expect(503);
    expect(res.body.message).to.equal('TTS_UNAVAILABLE');
  });

  it(`should answer 429 beyond ${MAX_TTS_SPEECH_URLS_PER_MINUTE} requests per minute`, async () => {
    sinon.stub(gladys.gateway, 'getTTSApiUrl').resolves({ url: 'https://plus.test/tts/signed.mp3' });
    for (let i = 0; i < MAX_TTS_SPEECH_URLS_PER_MINUTE; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await speechUrlRequest(token)
        .send({ text: `Message ${i}` })
        .expect(200);
    }
    const res = await speechUrlRequest(token)
      .send({ text: 'One too many' })
      .expect(429);
    expect(res.body.properties.time_before_next).to.be.within(1, 60);
  });
});
