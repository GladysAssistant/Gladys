const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;

const { WEBSOCKET_MESSAGE_TYPES, SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');
const { ExternalIntegrationUnavailableError } = require('../../../utils/coreErrors');
const { Error422 } = require('../../../utils/httpErrors');
const { buildSupervisor, seedExternalService, TEST_TTS_MANIFEST } = require('./testUtils.test');
const {
  TTS_SYNTHESIZE_TIMEOUT_MS,
  MAX_TTS_AUDIO_SIZE_BYTES,
  MAX_TTS_TEXT_LENGTH,
} = require('../../../lib/external-integration/constants');

const seedTtsService = (overrides = {}) => seedExternalService({ manifest: TEST_TTS_MANIFEST, ...overrides });

const audioDataUri = (buffer, contentType = 'audio/mpeg') => `${contentType};base64,${buffer.toString('base64')}`;

describe('externalIntegration TTS providers (type tts)', () => {
  describe('validateManifest', () => {
    it('should accept a tts manifest', () => {
      const { externalIntegration } = buildSupervisor();
      expect(externalIntegration.validateManifest(TEST_TTS_MANIFEST)).to.equal(TEST_TTS_MANIFEST);
    });

    it('should refuse messaging and contact_schema on a tts manifest', () => {
      const { externalIntegration } = buildSupervisor();
      const expect422 = (manifest, messagePart) => {
        try {
          externalIntegration.validateManifest(manifest);
          throw new Error('should have thrown');
        } catch (e) {
          expect(e).to.be.instanceOf(Error422);
          expect(e.properties).to.include(messagePart);
        }
      };
      expect422(
        { ...TEST_TTS_MANIFEST, messaging: { receive: false } },
        'messaging: only allowed on communication integrations',
      );
      expect422(
        {
          ...TEST_TTS_MANIFEST,
          contact_schema: [{ key: 'username', type: 'string', label: { en: 'Username' } }],
        },
        'contact_schema: only allowed on send-only communication integrations',
      );
    });
  });

  describe('uninstall of the selected TTS provider', () => {
    it('should clear TTS_ACTIVE_PROVIDER: no dangling selector after uninstall', async () => {
      const { externalIntegration, variable } = buildSupervisor();
      const service = await seedTtsService();
      await variable.setValue(SYSTEM_VARIABLE_NAMES.TTS_ACTIVE_PROVIDER, service.name);
      await externalIntegration.uninstall(service.selector);
      expect(await variable.getValue(SYSTEM_VARIABLE_NAMES.TTS_ACTIVE_PROVIDER)).to.equal(null);
    });

    it('should keep TTS_ACTIVE_PROVIDER when uninstalling another integration', async () => {
      const { externalIntegration, variable } = buildSupervisor();
      const service = await seedExternalService();
      await variable.setValue(SYSTEM_VARIABLE_NAMES.TTS_ACTIVE_PROVIDER, 'ext-other-tts');
      await externalIntegration.uninstall(service.selector);
      expect(await variable.getValue(SYSTEM_VARIABLE_NAMES.TTS_ACTIVE_PROVIDER)).to.equal('ext-other-tts');
    });
  });

  describe('registerProxyService (tts capability)', () => {
    it('should not expose the tts capability on a non-tts integration', async () => {
      const { externalIntegration, stateManager } = buildSupervisor();
      const service = await seedExternalService();
      externalIntegration.registerProxyService(service);
      const proxyService = stateManager.get('service', service.name);
      expect(proxyService.tts).to.equal(undefined);
    });

    it('should relay the synthesize command and return the validated audio', async () => {
      const { externalIntegration, stateManager } = buildSupervisor();
      const service = await seedTtsService();
      const audioBuffer = Buffer.from('fake-mp3-bytes');
      externalIntegration.sendCommand = fake.resolves({ success: true, data: { audio: audioDataUri(audioBuffer) } });
      externalIntegration.registerProxyService(service);
      const proxyService = stateManager.get('service', service.name);
      const result = await proxyService.tts.synthesize({ text: 'Bonjour !', language: 'fr' });
      expect(result.buffer.equals(audioBuffer)).to.equal(true);
      expect(result.contentType).to.equal('audio/mpeg');
      expect(result.extension).to.equal('mp3');
      assert.calledWith(
        externalIntegration.sendCommand,
        service,
        WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.TTS_SYNTHESIZE,
        { text: 'Bonjour !', language: 'fr' },
        { timeoutMs: TTS_SYNTHESIZE_TIMEOUT_MS },
      );
    });

    it('should default the language to null and map every accepted content type', async () => {
      const { externalIntegration, stateManager } = buildSupervisor();
      const service = await seedTtsService();
      const audioBuffer = Buffer.from('fake-wav-bytes');
      externalIntegration.sendCommand = fake.resolves({
        success: true,
        data: { audio: audioDataUri(audioBuffer, 'audio/wav') },
      });
      externalIntegration.registerProxyService(service);
      const proxyService = stateManager.get('service', service.name);
      const result = await proxyService.tts.synthesize({ text: 'Hello' });
      expect(result.contentType).to.equal('audio/wav');
      expect(result.extension).to.equal('wav');
      assert.calledWith(
        externalIntegration.sendCommand,
        service,
        WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.TTS_SYNTHESIZE,
        { text: 'Hello', language: null },
        { timeoutMs: TTS_SYNTHESIZE_TIMEOUT_MS },
      );
    });

    it('should cap the text before the relay: a long answer speaks its beginning', async () => {
      const { externalIntegration, stateManager } = buildSupervisor();
      const service = await seedTtsService();
      externalIntegration.sendCommand = fake.resolves({
        success: true,
        data: { audio: audioDataUri(Buffer.from('x')) },
      });
      externalIntegration.registerProxyService(service);
      const proxyService = stateManager.get('service', service.name);
      await proxyService.tts.synthesize({ text: 'a'.repeat(MAX_TTS_TEXT_LENGTH + 500) });
      const { text } = externalIntegration.sendCommand.firstCall.args[2];
      expect(text).to.have.lengthOf(MAX_TTS_TEXT_LENGTH);
    });

    it('should refuse a command-result without audio', async () => {
      const { externalIntegration, stateManager } = buildSupervisor();
      const service = await seedTtsService();
      externalIntegration.sendCommand = fake.resolves({ success: true });
      externalIntegration.registerProxyService(service);
      const proxyService = stateManager.get('service', service.name);
      await expect(proxyService.tts.synthesize({ text: 'Bonjour' })).to.be.rejectedWith(
        ExternalIntegrationUnavailableError,
        'EXTERNAL_INTEGRATION_INVALID_TTS_AUDIO',
      );
    });

    it('should refuse an audio outside the curated content types', async () => {
      const { externalIntegration, stateManager } = buildSupervisor();
      const service = await seedTtsService();
      externalIntegration.registerProxyService(service);
      const proxyService = stateManager.get('service', service.name);
      // not a data-URI at all
      externalIntegration.sendCommand = fake.resolves({ success: true, data: { audio: 'not-a-data-uri' } });
      await expect(proxyService.tts.synthesize({ text: 'Bonjour' })).to.be.rejectedWith(
        ExternalIntegrationUnavailableError,
        'EXTERNAL_INTEGRATION_INVALID_TTS_AUDIO',
      );
      // a content type nothing plays (nor an executable disguised as audio)
      externalIntegration.sendCommand = fake.resolves({
        success: true,
        data: { audio: audioDataUri(Buffer.from('x'), 'application/octet-stream') },
      });
      await expect(proxyService.tts.synthesize({ text: 'Bonjour' })).to.be.rejectedWith(
        ExternalIntegrationUnavailableError,
        'EXTERNAL_INTEGRATION_INVALID_TTS_AUDIO',
      );
      // an inherited Object.prototype key must not pass the allow-list
      externalIntegration.sendCommand = fake.resolves({
        success: true,
        data: { audio: audioDataUri(Buffer.from('x'), 'constructor') },
      });
      await expect(proxyService.tts.synthesize({ text: 'Bonjour' })).to.be.rejectedWith(
        ExternalIntegrationUnavailableError,
        'EXTERNAL_INTEGRATION_INVALID_TTS_AUDIO',
      );
    });

    it('should refuse an empty or oversized audio', async () => {
      const { externalIntegration, stateManager } = buildSupervisor();
      const service = await seedTtsService();
      externalIntegration.registerProxyService(service);
      const proxyService = stateManager.get('service', service.name);
      externalIntegration.sendCommand = fake.resolves({
        success: true,
        data: { audio: audioDataUri(Buffer.alloc(0)) },
      });
      await expect(proxyService.tts.synthesize({ text: 'Bonjour' })).to.be.rejectedWith(
        ExternalIntegrationUnavailableError,
        'EXTERNAL_INTEGRATION_INVALID_TTS_AUDIO',
      );
      externalIntegration.sendCommand = fake.resolves({
        success: true,
        data: { audio: audioDataUri(Buffer.alloc(MAX_TTS_AUDIO_SIZE_BYTES + 1)) },
      });
      await expect(proxyService.tts.synthesize({ text: 'Bonjour' })).to.be.rejectedWith(
        ExternalIntegrationUnavailableError,
        'EXTERNAL_INTEGRATION_INVALID_TTS_AUDIO',
      );
    });
  });
});
