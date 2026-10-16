const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;

const { buildTts, registerFakeTtsProvider } = require('./testUtils.test');
const { NotFoundError, BadParameters } = require('../../../utils/coreErrors');
const { MAX_TTS_AUDIO_SIZE_BYTES } = require('../../../lib/external-integration/constants');
const { SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');
const { GLADYS_PLUS_PROVIDER, TTS_AUDIO_TTL_MS } = require('../../../lib/tts/constants');

describe('tts.getSpeechUrl', () => {
  it('should dispatch to Gladys Plus by default (no variable set)', async () => {
    const { tts, gateway } = buildTts();
    const result = await tts.getSpeechUrl({ text: 'Bonjour !' });
    expect(result).to.deep.equal({ url: 'https://plus.test/audio.mp3', provider: GLADYS_PLUS_PROVIDER });
    assert.calledWith(gateway.getTTSApiUrl, { text: 'Bonjour !' });
  });

  it('should return a null url on an empty Gladys Plus response', async () => {
    const { tts } = buildTts({ gateway: { getTTSApiUrl: fake.resolves({}) } });
    const result = await tts.getSpeechUrl({ text: 'Bonjour !' });
    expect(result).to.deep.equal({ url: null, provider: GLADYS_PLUS_PROVIDER });
  });

  it('should synthesize through the active provider and mint a LAN audio URL', async () => {
    const { tts, stateManager, variableStore } = buildTts();
    const synthesize = registerFakeTtsProvider(stateManager, 'ext-piper-tts');
    variableStore.set(SYSTEM_VARIABLE_NAMES.TTS_ACTIVE_PROVIDER, 'ext-piper-tts');
    tts.getLocalApiBaseUrl = fake.returns('http://192.168.1.10:1443');
    const { url, provider } = await tts.getSpeechUrl({ text: 'Bonjour !', language: 'fr' });
    expect(provider).to.equal('ext-piper-tts');
    const urlRegex = /^http:\/\/192\.168\.1\.10:1443\/api\/v1\/tts\/audio\/([0-9a-f]{64})\.mp3$/;
    expect(url).to.match(urlRegex);
    assert.calledWith(synthesize, { text: 'Bonjour !', language: 'fr' });
    // the clip is retrievable behind its token, for the whole TTL
    const token = url.match(urlRegex)[1];
    const { buffer, contentType } = tts.getAudio(token);
    expect(buffer.equals(Buffer.from('fake-mp3-bytes'))).to.equal(true);
    expect(contentType).to.equal('audio/mpeg');
    expect(tts.audios.get(token).expiresAt).to.be.greaterThan(Date.now());
    expect(tts.audios.get(token).expiresAt).to.be.at.most(Date.now() + TTS_AUDIO_TTL_MS);
  });

  it('should default the language to null', async () => {
    const { tts, stateManager, variableStore } = buildTts();
    const synthesize = registerFakeTtsProvider(stateManager, 'ext-piper-tts');
    variableStore.set(SYSTEM_VARIABLE_NAMES.TTS_ACTIVE_PROVIDER, 'ext-piper-tts');
    tts.getLocalApiBaseUrl = fake.returns('http://192.168.1.10:1443');
    await tts.getSpeechUrl({ text: 'Hello' });
    assert.calledWith(synthesize, { text: 'Hello', language: null });
  });

  it('should refuse an invalid provider payload before caching or minting a URL', async () => {
    const { tts, stateManager, variableStore } = buildTts();
    variableStore.set(SYSTEM_VARIABLE_NAMES.TTS_ACTIVE_PROVIDER, 'ext-piper-tts');
    tts.getLocalApiBaseUrl = fake.returns('http://192.168.1.10:1443');
    const invalidPayloads = [
      // not a buffer at all
      { buffer: 'not-a-buffer', contentType: 'audio/mpeg', extension: 'mp3' },
      // empty and oversized buffers
      { buffer: Buffer.alloc(0), contentType: 'audio/mpeg', extension: 'mp3' },
      { buffer: Buffer.alloc(MAX_TTS_AUDIO_SIZE_BYTES + 1), contentType: 'audio/mpeg', extension: 'mp3' },
      // content type outside the curated list (inherited object keys included)
      { buffer: Buffer.from('x'), contentType: 'application/octet-stream', extension: 'mp3' },
      { buffer: Buffer.from('x'), contentType: 'constructor', extension: 'mp3' },
      // extension not matching the curated mapping of the content type
      { buffer: Buffer.from('x'), contentType: 'audio/mpeg', extension: 'exe' },
    ];
    // eslint-disable-next-line no-restricted-syntax
    for (const payload of invalidPayloads) {
      registerFakeTtsProvider(stateManager, 'ext-piper-tts', fake.resolves(payload));
      // eslint-disable-next-line no-await-in-loop
      await expect(tts.getSpeechUrl({ text: 'Bonjour' })).to.be.rejectedWith(BadParameters);
    }
    expect(tts.audios.size).to.equal(0);
  });

  it('should throw when the configured provider is gone or invalid — no silent fallback', async () => {
    const { tts, stateManager, variableStore } = buildTts();
    // uninstalled: no service under that name
    variableStore.set(SYSTEM_VARIABLE_NAMES.TTS_ACTIVE_PROVIDER, 'ext-gone-tts');
    await expect(tts.getSpeechUrl({ text: 'Bonjour' })).to.be.rejectedWith(NotFoundError);
    // a service that lost the capability
    stateManager.setState('service', 'ext-gone-tts', { device: {} });
    await expect(tts.getSpeechUrl({ text: 'Bonjour' })).to.be.rejectedWith(NotFoundError);
    // a service whose synthesize is not callable
    stateManager.setState('service', 'ext-gone-tts', { tts: { synthesize: 'not-a-function' } });
    await expect(tts.getSpeechUrl({ text: 'Bonjour' })).to.be.rejectedWith(NotFoundError);
  });
});
