const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;

const Tts = require('../../../lib/tts');
const { SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');
const {
  BadParameters,
  TooManyRequests,
  NotFoundError,
  ExternalIntegrationUnavailableError,
} = require('../../../utils/coreErrors');
const { Error402, Error403, Error429, Error503 } = require('../../../utils/httpErrors');
const { MAX_TTS_TEXT_LENGTH, MAX_TTS_SPEECH_URLS_PER_MINUTE } = require('../../../lib/external-integration/constants');
const { buildSupervisor, seedExternalService, TEST_TTS_MANIFEST } = require('./testUtils.test');

const LAN_BASE_URL = 'http://192.168.1.10:80';
const AUDIO_URL_REGEX = /^http:\/\/192\.168\.1\.10:80\/api\/v1\/tts\/audio\/([0-9a-f]{64})\.mp3$/;

/**
 * @description A supervisor whose tts manager is a real one, sharing the
 * supervisor's stateManager and variables (the lib/index.js wiring), so an
 * integration provider registered by registerProxyService is the voice.
 * @param {object} [options] - Options.
 * @param {object} [options.gateway] - Gateway fakes overrides.
 * @returns {object} The supervisor fakes plus { tts, gateway, user }.
 * @example
 * const { externalIntegration, tts } = buildSpeakingSupervisor();
 */
function buildSpeakingSupervisor({ gateway: gatewayOverrides } = {}) {
  const supervisor = buildSupervisor();
  const { stateManager, variable } = supervisor;
  const gateway = {
    getTTSApiUrl: fake.resolves({ url: 'https://plus.test/tts/signed.mp3' }),
    ...gatewayOverrides,
  };
  const user = { getByRole: fake.resolves([{ language: 'fr' }]) };
  const serviceManager = { getService: (name) => stateManager.get('service', name) };
  const tts = new Tts(variable, serviceManager, stateManager, gateway, { isOnHostNetwork: fake.resolves(true) }, user);
  tts.getLocalApiBaseUrl = fake.resolves(LAN_BASE_URL);
  supervisor.externalIntegration.tts = tts;
  return { ...supervisor, tts, gateway, user };
}

const expect503 = async (promise) => {
  try {
    await promise;
  } catch (e) {
    expect(e).to.be.instanceOf(Error503);
    expect(e.status).to.equal(503);
    expect(e.message).to.equal('TTS_UNAVAILABLE');
    return;
  }
  throw new Error('should have thrown');
};

const expectBadParameters = async (promise, messagePart) => {
  try {
    await promise;
  } catch (e) {
    expect(e).to.be.instanceOf(BadParameters);
    expect(e.message).to.include(messagePart);
    return;
  }
  throw new Error('should have thrown');
};

describe('externalIntegration.getSpeechUrl', () => {
  const caller = { id: 'b2d23f66-487d-493f-8acb-9c8adb400def', selector: 'ext-karotz', manifest: { type: 'device' } };

  afterEach(() => {
    sinon.restore();
  });

  describe('with Gladys Plus as the voice', () => {
    it('should return the signed URL of Gladys Plus', async () => {
      const { externalIntegration, gateway } = buildSpeakingSupervisor();
      const result = await externalIntegration.getSpeechUrl(caller, { text: 'Bonjour !', language: 'fr' });
      expect(result).to.deep.equal({ url: 'https://plus.test/tts/signed.mp3' });
      assert.calledOnceWithExactly(gateway.getTTSApiUrl, { text: 'Bonjour !' });
    });

    [
      ['402 (instance locked, no payment)', new Error402('GLADYS_PLUS_PAYMENT_REQUIRED')],
      ['403 (no Gladys Plus subscription)', new Error403('NO_TTS_ACCESS')],
      ['429 (TTS quota reached)', new Error429({ message: 'quota' })],
    ].forEach(([label, error]) => {
      it(`should answer 503 TTS_UNAVAILABLE on a Gladys Plus ${label}, never the upsell code`, async () => {
        const { externalIntegration } = buildSpeakingSupervisor({ gateway: { getTTSApiUrl: fake.rejects(error) } });
        await expect503(externalIntegration.getSpeechUrl(caller, { text: 'Bonjour !' }));
      });
    });

    it('should answer 503 when Gladys Plus returns no URL', async () => {
      const { externalIntegration } = buildSpeakingSupervisor({ gateway: { getTTSApiUrl: fake.resolves({}) } });
      await expect503(externalIntegration.getSpeechUrl(caller, { text: 'Bonjour !' }));
    });
  });

  describe('with an integration provider as the voice', () => {
    it('should relay to the tts integration and return a LAN URL serving its clip', async () => {
      const { externalIntegration, tts, variable } = buildSpeakingSupervisor();
      const provider = await seedExternalService({
        name: 'ext-piper-tts',
        selector: 'ext-piper-tts',
        manifest: TEST_TTS_MANIFEST,
      });
      const audio = Buffer.from('fake-mp3-bytes');
      externalIntegration.sendCommand = fake.resolves({
        success: true,
        data: { audio: `audio/mpeg;base64,${audio.toString('base64')}` },
      });
      externalIntegration.registerProxyService(provider);
      await variable.setValue(SYSTEM_VARIABLE_NAMES.TTS_ACTIVE_PROVIDER, provider.name);

      const { url } = await externalIntegration.getSpeechUrl(caller, { text: 'Bonjour !', language: 'fr-FR' });

      // the provider integration got the synthesize command, with the
      // caller's text and language
      assert.calledOnce(externalIntegration.sendCommand);
      const [target, , payload] = externalIntegration.sendCommand.firstCall.args;
      expect(target.id).to.equal(provider.id);
      expect(payload).to.deep.include({ text: 'Bonjour !', language: 'fr-FR' });
      // and the URL serves exactly that clip, behind its token
      const [, token] = url.match(AUDIO_URL_REGEX);
      const clip = tts.getAudio(token);
      expect(clip.contentType).to.equal('audio/mpeg');
      expect(clip.buffer.equals(audio)).to.equal(true);
    });

    it("should fall back to the first administrator's language without a language", async () => {
      const { externalIntegration, stateManager, variable } = buildSpeakingSupervisor();
      const synthesize = fake.resolves({ buffer: Buffer.from('mp3'), contentType: 'audio/mpeg', extension: 'mp3' });
      stateManager.setState('service', 'ext-piper-tts', { tts: { synthesize } });
      await variable.setValue(SYSTEM_VARIABLE_NAMES.TTS_ACTIVE_PROVIDER, 'ext-piper-tts');
      const { url } = await externalIntegration.getSpeechUrl(caller, { text: 'Bonjour !' });
      expect(url).to.match(AUDIO_URL_REGEX);
      assert.calledOnceWithExactly(synthesize, { text: 'Bonjour !', language: 'fr' });
    });

    it('should answer 503 when the selected provider is not running (no silent fallback)', async () => {
      const { externalIntegration, variable, gateway } = buildSpeakingSupervisor();
      await variable.setValue(SYSTEM_VARIABLE_NAMES.TTS_ACTIVE_PROVIDER, 'ext-stopped-tts');
      await expect503(externalIntegration.getSpeechUrl(caller, { text: 'Bonjour !' }));
      assert.notCalled(gateway.getTTSApiUrl);
    });

    [
      ['a timeout or a refused command', new ExternalIntegrationUnavailableError('TIMEOUT')],
      ['a provider gone missing', new NotFoundError('TTS provider "ext-piper-tts" is not available')],
      // the defense-in-depth check of tts.getSpeechUrl throws BadParameters:
      // the clip is the provider's fault, never a 400 to the caller
      ['an invalid clip', new BadParameters('TTS provider "ext-piper-tts" returned an invalid audio payload')],
      // the same codes as the Gladys Plus upsell, from an integration provider
      ['a 429 thrown by the provider', new Error429({})],
    ].forEach(([label, error]) => {
      it(`should answer 503 TTS_UNAVAILABLE on ${label}`, async () => {
        const { externalIntegration, stateManager, variable } = buildSpeakingSupervisor();
        stateManager.setState('service', 'ext-piper-tts', { tts: { synthesize: fake.rejects(error) } });
        await variable.setValue(SYSTEM_VARIABLE_NAMES.TTS_ACTIVE_PROVIDER, 'ext-piper-tts');
        await expect503(externalIntegration.getSpeechUrl(caller, { text: 'Bonjour !' }));
      });
    });
  });

  it('should answer 503 when no tts manager is attached', async () => {
    const { externalIntegration } = buildSupervisor();
    await expect503(externalIntegration.getSpeechUrl(caller, { text: 'Bonjour !' }));
  });

  describe('request validation', () => {
    [
      [null, 'body'],
      ['Bonjour', 'body'],
      [[], 'body'],
      [{}, 'text'],
      [{ text: 42 }, 'text'],
      [{ text: '' }, 'text'],
      [{ text: ' \n\t ' }, 'text'],
      [{ text: 'a'.repeat(MAX_TTS_TEXT_LENGTH + 1) }, 'text'],
      [{ text: 'Bonjour', language: 42 }, 'language'],
      [{ text: 'Bonjour', language: '' }, 'language'],
      [{ text: 'Bonjour', language: 'f' }, 'language'],
      [{ text: 'Bonjour', language: 'fr; rm -rf /' }, 'language'],
      [{ text: 'Bonjour', language: `fr-${'a'.repeat(9)}` }, 'language'],
    ].forEach(([body, field]) => {
      it(`should refuse ${JSON.stringify(body) &&
        JSON.stringify(body).slice(0, 60)} with a 400 on ${field}`, async () => {
        const { externalIntegration, gateway } = buildSpeakingSupervisor();
        await expectBadParameters(externalIntegration.getSpeechUrl(caller, body), `${field}:`);
        assert.notCalled(gateway.getTTSApiUrl);
      });
    });

    it('should accept a text of exactly the maximum length and the usual language tags', async () => {
      const { externalIntegration, gateway } = buildSpeakingSupervisor();
      await externalIntegration.getSpeechUrl(caller, { text: 'a'.repeat(MAX_TTS_TEXT_LENGTH) });
      await externalIntegration.getSpeechUrl(caller, { text: 'Bonjour', language: 'fr' });
      await externalIntegration.getSpeechUrl(caller, { text: 'Hello', language: 'en-US' });
      await externalIntegration.getSpeechUrl(caller, { text: 'Olá', language: 'pt_BR' });
      await externalIntegration.getSpeechUrl(caller, { text: 'Hallo', language: null });
      assert.callCount(gateway.getTTSApiUrl, 5);
    });

    it('should not count a refused request against the rate limit', async () => {
      const { externalIntegration } = buildSpeakingSupervisor();
      for (let i = 0; i < MAX_TTS_SPEECH_URLS_PER_MINUTE + 5; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await expectBadParameters(externalIntegration.getSpeechUrl(caller, { text: '' }), 'text:');
      }
      const result = await externalIntegration.getSpeechUrl(caller, { text: 'Bonjour !' });
      expect(result.url).to.equal('https://plus.test/tts/signed.mp3');
    });
  });

  describe('rate limit', () => {
    it(`should allow ${MAX_TTS_SPEECH_URLS_PER_MINUTE} requests per minute per integration, then 429`, async () => {
      const { externalIntegration, gateway } = buildSpeakingSupervisor();
      for (let i = 0; i < MAX_TTS_SPEECH_URLS_PER_MINUTE; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await externalIntegration.getSpeechUrl(caller, { text: `Message ${i}` });
      }
      try {
        await externalIntegration.getSpeechUrl(caller, { text: 'One too many' });
        throw new Error('should have thrown');
      } catch (e) {
        expect(e).to.be.instanceOf(TooManyRequests);
        expect(e.message).to.include('RATE_LIMIT_EXCEEDED');
        expect(e.timeBeforeNext).to.be.within(1, 60);
      }
      assert.callCount(gateway.getTTSApiUrl, MAX_TTS_SPEECH_URLS_PER_MINUTE);
      // another integration has its own counter
      const other = { ...caller, id: 'a3a6c6d5-0d1b-4c41-9fd5-7c1e2b8f4a11', selector: 'ext-doorbell' };
      const result = await externalIntegration.getSpeechUrl(other, { text: 'Ding dong' });
      expect(result.url).to.equal('https://plus.test/tts/signed.mp3');
    });

    it('should count a request whose voice then fails', async () => {
      const { externalIntegration } = buildSpeakingSupervisor({
        gateway: { getTTSApiUrl: fake.rejects(new Error403('NO_TTS_ACCESS')) },
      });
      for (let i = 0; i < MAX_TTS_SPEECH_URLS_PER_MINUTE; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await expect503(externalIntegration.getSpeechUrl(caller, { text: 'Bonjour !' }));
      }
      try {
        await externalIntegration.getSpeechUrl(caller, { text: 'Bonjour !' });
        throw new Error('should have thrown');
      } catch (e) {
        expect(e).to.be.instanceOf(TooManyRequests);
      }
    });

    it('should open a new window once the minute is over', async () => {
      const clock = sinon.useFakeTimers({ now: Date.now(), toFake: ['Date'] });
      const { externalIntegration } = buildSpeakingSupervisor();
      for (let i = 0; i < MAX_TTS_SPEECH_URLS_PER_MINUTE; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await externalIntegration.getSpeechUrl(caller, { text: `Message ${i}` });
      }
      clock.tick(60 * 1000);
      const result = await externalIntegration.getSpeechUrl(caller, { text: 'Next minute' });
      expect(result.url).to.equal('https://plus.test/tts/signed.mp3');
    });

    it('should forget the counter of an uninstalled integration', async () => {
      const { externalIntegration } = buildSpeakingSupervisor();
      const service = await seedExternalService();
      await externalIntegration.getSpeechUrl(service, { text: 'Bonjour !' });
      expect(externalIntegration.speechUrlRateLimits.has(service.id)).to.equal(true);
      await externalIntegration.uninstall(service.selector);
      expect(externalIntegration.speechUrlRateLimits.has(service.id)).to.equal(false);
    });
  });
});
