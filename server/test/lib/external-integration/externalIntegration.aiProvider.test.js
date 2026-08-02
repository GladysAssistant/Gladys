const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const { BadParameters, NotFoundError, ExternalIntegrationUnavailableError } = require('../../../utils/coreErrors');
const { Error422 } = require('../../../utils/httpErrors');
const { WEBSOCKET_MESSAGE_TYPES, SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');
const { validateManifest } = require('../../../lib/external-integration/externalIntegration.validateManifest');
const { AI_CHAT_TIMEOUT_MS } = require('../../../lib/external-integration/constants');
const { buildSupervisor, seedExternalService, TEST_AI_MANIFEST } = require('./testUtils.test');

const seedAiService = (overrides = {}) =>
  seedExternalService({
    name: 'ext-dev-claude-provider-demo',
    selector: 'ext-dev-claude-provider-demo',
    docker_image: TEST_AI_MANIFEST.docker_image,
    manifest: TEST_AI_MANIFEST,
    ...overrides,
  });

describe('externalIntegration.validateManifest (ai type)', () => {
  it('should accept an ai manifest', () => {
    expect(validateManifest(TEST_AI_MANIFEST)).to.equal(TEST_AI_MANIFEST);
  });

  it('should reject messaging on an ai manifest', () => {
    try {
      validateManifest({ ...TEST_AI_MANIFEST, messaging: { receive: true } });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(Error422);
      expect(e.properties).to.include('messaging: only allowed on communication integrations');
    }
  });
});

describe('externalIntegration.aiChat', () => {
  it('should relay the request over WebSocket with the dedicated timeout', async () => {
    const { externalIntegration } = buildSupervisor();
    const service = await seedAiService();
    const completion = { choices: [{ message: { role: 'assistant', content: 'Hello!' } }] };
    externalIntegration.sendCommand = fake.resolves({ success: true, data: completion });
    const request = { messages: [{ role: 'user', content: 'Hi' }], tools: [], tool_choice: 'auto', purpose: 'chat' };
    const result = await externalIntegration.aiChat(service, request);
    expect(result).to.deep.equal(completion);
    assert.calledOnceWithExactly(
      externalIntegration.sendCommand,
      service,
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.AI_CHAT,
      { request },
      { timeoutMs: AI_CHAT_TIMEOUT_MS },
    );
  });

  it('should throw when the integration acks a non-object completion', async () => {
    const { externalIntegration } = buildSupervisor();
    const service = await seedAiService();
    const invalidAcks = [
      { success: true },
      { success: true, data: 'raw text' },
      { success: true, data: [1, 2] },
      { success: true, data: null },
    ];
    // eslint-disable-next-line no-restricted-syntax
    for (const ack of invalidAcks) {
      externalIntegration.sendCommand = fake.resolves(ack);
      // eslint-disable-next-line no-await-in-loop
      await expect(externalIntegration.aiChat(service, { messages: [] })).to.be.rejectedWith(
        ExternalIntegrationUnavailableError,
      );
    }
  });

  it('should throw when the integration is not connected', async () => {
    const { externalIntegration } = buildSupervisor();
    const service = await seedAiService();
    await expect(externalIntegration.aiChat(service, { messages: [] })).to.be.rejectedWith(
      ExternalIntegrationUnavailableError,
    );
  });
});

describe('externalIntegration.registerProxyService (ai)', () => {
  it('should expose the ai.chat capability for ai integrations', async () => {
    const { externalIntegration, stateManager } = buildSupervisor();
    const service = await seedAiService();
    const completion = { choices: [] };
    externalIntegration.sendCommand = fake.resolves({ success: true, data: completion });
    externalIntegration.registerProxyService(service);
    const proxyService = stateManager.get('service', service.name);
    expect(proxyService.ai).to.have.property('chat');
    expect(proxyService.message).to.equal(undefined);
    const result = await proxyService.ai.chat({ messages: [] });
    expect(result).to.deep.equal(completion);
    assert.calledWith(externalIntegration.sendCommand, service, WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.AI_CHAT, {
      request: { messages: [] },
    });
  });

  it('should not expose the ai capability for device integrations', async () => {
    const { externalIntegration, stateManager } = buildSupervisor();
    const service = await seedExternalService();
    externalIntegration.registerProxyService(service);
    const proxyService = stateManager.get('service', service.name);
    expect(proxyService.ai).to.equal(undefined);
  });
});

describe('externalIntegration.getAiProviders', () => {
  it('should list only the ai integrations', async () => {
    const { externalIntegration } = buildSupervisor();
    await seedExternalService();
    const aiService = await seedAiService();
    const providers = await externalIntegration.getAiProviders();
    expect(providers).to.deep.equal([
      {
        selector: aiService.selector,
        name: TEST_AI_MANIFEST.name,
        status: aiService.status,
      },
    ]);
  });

  it('should fall back to the service name without a manifest name', async () => {
    const { externalIntegration } = buildSupervisor();
    const aiService = await seedAiService({ manifest: { ...TEST_AI_MANIFEST, name: undefined } });
    const providers = await externalIntegration.getAiProviders();
    expect(providers).to.deep.equal([
      {
        selector: aiService.selector,
        name: aiService.name,
        status: aiService.status,
      },
    ]);
  });
});

describe('externalIntegration.setAiProvider', () => {
  it('should persist the selector of an ai integration', async () => {
    const { externalIntegration, variable } = buildSupervisor();
    const aiService = await seedAiService();
    const selector = await externalIntegration.setAiProvider(aiService.selector);
    expect(selector).to.equal(aiService.selector);
    expect(await variable.getValue(SYSTEM_VARIABLE_NAMES.AI_PROVIDER)).to.equal(aiService.selector);
  });

  it('should reset to the Gladys Plus default with a null selector', async () => {
    const { externalIntegration, variable } = buildSupervisor();
    const aiService = await seedAiService();
    await externalIntegration.setAiProvider(aiService.selector);
    const selector = await externalIntegration.setAiProvider(null);
    expect(selector).to.equal(null);
    expect(await variable.getValue(SYSTEM_VARIABLE_NAMES.AI_PROVIDER)).to.equal(null);
  });

  it('should reject an integration that is not an AI provider', async () => {
    const { externalIntegration } = buildSupervisor();
    const deviceService = await seedExternalService();
    await expect(externalIntegration.setAiProvider(deviceService.selector)).to.be.rejectedWith(BadParameters);
  });

  it('should reject an unknown selector', async () => {
    const { externalIntegration } = buildSupervisor();
    await expect(externalIntegration.setAiProvider('ext-unknown')).to.be.rejectedWith(NotFoundError);
  });
});

describe('externalIntegration.uninstall (ai provider cleanup)', () => {
  it('should clear the AI provider selection when uninstalling the selected provider', async () => {
    const { externalIntegration, variable } = buildSupervisor();
    const aiService = await seedAiService();
    await externalIntegration.setAiProvider(aiService.selector);
    await externalIntegration.uninstall(aiService.selector);
    expect(await variable.getValue(SYSTEM_VARIABLE_NAMES.AI_PROVIDER)).to.equal(null);
  });

  it('should keep the AI provider selection when uninstalling another integration', async () => {
    const { externalIntegration, variable } = buildSupervisor();
    const aiService = await seedAiService();
    const deviceService = await seedExternalService();
    await externalIntegration.setAiProvider(aiService.selector);
    await externalIntegration.uninstall(deviceService.selector);
    expect(await variable.getValue(SYSTEM_VARIABLE_NAMES.AI_PROVIDER)).to.equal(aiService.selector);
  });
});
