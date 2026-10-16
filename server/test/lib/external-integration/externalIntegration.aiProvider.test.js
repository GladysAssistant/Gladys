const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;

const { BadParameters, NotFoundError, ExternalIntegrationUnavailableError } = require('../../../utils/coreErrors');
const { Error422 } = require('../../../utils/httpErrors');
const { WEBSOCKET_MESSAGE_TYPES, SYSTEM_VARIABLE_NAMES, AI_CHAT_PURPOSES } = require('../../../utils/constants');
const { validateManifest } = require('../../../lib/external-integration/externalIntegration.validateManifest');
const {
  AI_CHAT_TIMEOUT_MS,
  AI_CHAT_INTENT_CLASSIFICATION_TIMEOUT_MS,
  MAX_AI_CHAT_IN_FLIGHT,
  MAX_AI_CHAT_CONTENT_CHARS,
  MAX_AI_CHAT_TOOL_CALLS,
  MAX_AI_CHAT_TOOL_ARGUMENTS_CHARS,
} = require('../../../lib/external-integration/constants');
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
    // nothing left in flight once answered
    expect(externalIntegration.aiChatInFlight.has(service.id)).to.equal(false);
  });

  it('should relay an intent classification with its short timeout', async () => {
    // the router runs before every chat turn and swallows its failures: a
    // stuck provider must fail it fast, never add a second full deadline
    const { externalIntegration } = buildSupervisor();
    const service = await seedAiService();
    const completion = { choices: [{ message: { role: 'assistant', content: '["lights"]' } }] };
    externalIntegration.sendCommand = fake.resolves({ success: true, data: completion });
    const request = { messages: [], purpose: AI_CHAT_PURPOSES.INTENT_CLASSIFICATION };
    await externalIntegration.aiChat(service, request);
    assert.calledOnceWithExactly(
      externalIntegration.sendCommand,
      service,
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.AI_CHAT,
      { request },
      { timeoutMs: AI_CHAT_INTENT_CLASSIFICATION_TIMEOUT_MS },
    );
    expect(AI_CHAT_INTENT_CLASSIFICATION_TIMEOUT_MS).to.be.below(AI_CHAT_TIMEOUT_MS);
  });

  it('should settle a request pending across an uninstall without corrupting the counter', async () => {
    const { externalIntegration } = buildSupervisor();
    const service = await seedAiService();
    const completion = { choices: [{ message: { role: 'assistant', content: 'ok' } }] };
    let resolvePending;
    externalIntegration.sendCommand = fake(
      () =>
        new Promise((resolve) => {
          resolvePending = resolve;
        }),
    );
    const pending = externalIntegration.aiChat(service, { messages: [] });
    // uninstall drops the entry while the request is still pending
    externalIntegration.aiChatInFlight.delete(service.id);
    resolvePending({ success: true, data: completion });
    expect(await pending).to.deep.equal(completion);
    expect(externalIntegration.aiChatInFlight.has(service.id)).to.equal(false);
  });

  it('should keep only the consumed fields of the completion, bounded', async () => {
    // the payload comes from unaudited code and drives the tool-calling
    // loop: everything the loop does not consume is dropped, the rest is
    // bounded (content length, tool calls count, arguments size, names)
    const { externalIntegration } = buildSupervisor();
    const service = await seedAiService();
    externalIntegration.sendCommand = fake.resolves({
      success: true,
      data: {
        id: 'chatcmpl-1',
        model: 'claude-x',
        usage: { total_tokens: 12 },
        choices: [
          {
            index: 0,
            finish_reason: 'tool_calls',
            message: {
              role: 'assistant',
              content: `${'x'.repeat(MAX_AI_CHAT_CONTENT_CHARS)}overflow`,
              refusal: null,
              tool_calls: [
                {
                  id: `${'c'.repeat(200)}`,
                  type: 'function',
                  extra: true,
                  function: { name: 'weather_get', arguments: '{"house":"home"}', extra: true },
                },
                // arguments default to an empty object, a missing id stays null
                { type: 'function', function: { name: 'scene_create' } },
              ],
            },
          },
          { index: 1, message: { role: 'assistant', content: 'ignored second choice' } },
        ],
      },
    });
    const result = await externalIntegration.aiChat(service, { messages: [] });
    expect(result).to.deep.equal({
      choices: [
        {
          message: {
            role: 'assistant',
            content: 'x'.repeat(MAX_AI_CHAT_CONTENT_CHARS),
            tool_calls: [
              {
                id: 'c'.repeat(128),
                type: 'function',
                function: { name: 'weather_get', arguments: '{"house":"home"}' },
              },
              { id: null, type: 'function', function: { name: 'scene_create', arguments: '{}' } },
            ],
          },
        },
      ],
    });
  });

  it('should accept a null content and drop an empty tool_calls list', async () => {
    const { externalIntegration } = buildSupervisor();
    const service = await seedAiService();
    externalIntegration.sendCommand = fake.resolves({
      success: true,
      data: { choices: [{ message: { role: 'assistant', content: null, tool_calls: [] } }] },
    });
    const result = await externalIntegration.aiChat(service, { messages: [] });
    expect(result).to.deep.equal({ choices: [{ message: { role: 'assistant', content: null } }] });
  });

  it('should throw when the integration acks a malformed completion', async () => {
    const { externalIntegration } = buildSupervisor();
    const service = await seedAiService();
    const validToolCall = { id: 'call_1', type: 'function', function: { name: 'weather_get', arguments: '{}' } };
    const invalidAcks = [
      { success: true },
      { success: true, data: 'raw text' },
      { success: true, data: [1, 2] },
      { success: true, data: null },
      // objects that are not OpenAI-compatible completions: adapter bugs
      // must fail at the contract boundary, not as a silent empty turn
      { success: true, data: {} },
      { success: true, data: { choices: 'not-an-array' } },
      { success: true, data: { choices: [] } },
      { success: true, data: { choices: [{}] } },
      { success: true, data: { choices: ['raw'] } },
      { success: true, data: { choices: [{ message: 'raw text' }] } },
      { success: true, data: { choices: [{ message: [1] }] } },
      // content must be a string or null
      { success: true, data: { choices: [{ message: { content: 42 } }] } },
      { success: true, data: { choices: [{ message: { content: { text: 'hi' } } }] } },
      // tool calls the loop could not run
      { success: true, data: { choices: [{ message: { content: null, tool_calls: 'call' } }] } },
      { success: true, data: { choices: [{ message: { content: null, tool_calls: ['call'] } }] } },
      { success: true, data: { choices: [{ message: { content: null, tool_calls: [{ type: 'function' }] } }] } },
      {
        success: true,
        data: { choices: [{ message: { content: null, tool_calls: [{ function: { name: 'bad name!' } }] } }] },
      },
      {
        success: true,
        data: { choices: [{ message: { content: null, tool_calls: [{ function: { name: 42 } }] } }] },
      },
      {
        success: true,
        data: {
          choices: [{ message: { content: null, tool_calls: [{ function: { name: 'ok', arguments: {} } }] } }],
        },
      },
      {
        success: true,
        data: {
          choices: [
            {
              message: {
                content: null,
                tool_calls: [{ function: { name: 'ok', arguments: 'a'.repeat(MAX_AI_CHAT_TOOL_ARGUMENTS_CHARS + 1) } }],
              },
            },
          ],
        },
      },
      {
        success: true,
        data: {
          choices: [{ message: { content: null, tool_calls: Array(MAX_AI_CHAT_TOOL_CALLS + 1).fill(validToolCall) } }],
        },
      },
    ];
    // eslint-disable-next-line no-restricted-syntax
    for (const ack of invalidAcks) {
      externalIntegration.sendCommand = fake.resolves(ack);
      // eslint-disable-next-line no-await-in-loop
      await expect(externalIntegration.aiChat(service, { messages: [] })).to.be.rejectedWith(
        ExternalIntegrationUnavailableError,
        'EXTERNAL_INTEGRATION_INVALID_AI_RESPONSE',
      );
    }
  });

  it('should throw when the integration is not connected', async () => {
    const { externalIntegration } = buildSupervisor();
    const service = await seedAiService();
    await expect(externalIntegration.aiChat(service, { messages: [] })).to.be.rejectedWith(
      ExternalIntegrationUnavailableError,
    );
    expect(externalIntegration.aiChatInFlight.has(service.id)).to.equal(false);
  });

  it('should cap the requests in flight per provider', async () => {
    // an ai.ask scene fired on every motion must not flood a CPU-bound local
    // model: beyond the cap the request fails at once, and the slot is
    // released when a pending request settles
    const { externalIntegration } = buildSupervisor();
    const service = await seedAiService();
    const otherService = await seedAiService({ name: 'ext-dev-other-ai', selector: 'ext-dev-other-ai' });
    const completion = { choices: [{ message: { role: 'assistant', content: 'ok' } }] };
    const pending = [];
    externalIntegration.sendCommand = fake(
      () =>
        new Promise((resolve) => {
          pending.push(resolve);
        }),
    );
    const inFlight = Array.from({ length: MAX_AI_CHAT_IN_FLIGHT }, () =>
      externalIntegration.aiChat(service, { messages: [] }),
    );
    expect(externalIntegration.aiChatInFlight.get(service.id)).to.equal(MAX_AI_CHAT_IN_FLIGHT);
    await expect(externalIntegration.aiChat(service, { messages: [] })).to.be.rejectedWith(
      ExternalIntegrationUnavailableError,
      'EXTERNAL_INTEGRATION_AI_PROVIDER_BUSY',
    );
    // the cap is per integration
    const otherRequest = externalIntegration.aiChat(otherService, { messages: [] });
    expect(pending).to.have.lengthOf(MAX_AI_CHAT_IN_FLIGHT + 1);
    pending.forEach((resolve) => resolve({ success: true, data: completion }));
    const results = await Promise.all([...inFlight, otherRequest]);
    results.forEach((result) => expect(result).to.deep.equal(completion));
    expect(externalIntegration.aiChatInFlight.has(service.id)).to.equal(false);
    expect(externalIntegration.aiChatInFlight.has(otherService.id)).to.equal(false);
    // the slot is free again
    externalIntegration.sendCommand = fake.resolves({ success: true, data: completion });
    expect(await externalIntegration.aiChat(service, { messages: [] })).to.deep.equal(completion);
  });
});

describe('externalIntegration.registerProxyService (ai)', () => {
  it('should expose the ai.chat capability for ai integrations', async () => {
    const { externalIntegration, stateManager } = buildSupervisor();
    const service = await seedAiService();
    const completion = { choices: [{ message: { role: 'assistant', content: 'ok' } }] };
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

  it('should roll back when the provider is uninstalled concurrently', async () => {
    // the provider passes validation but its t_service row disappears
    // before the write is re-checked (concurrent uninstall): the variable
    // must not be left pointing to a removed integration
    const { externalIntegration, variable } = buildSupervisor();
    externalIntegration.getBySelector = fake.resolves({
      selector: 'ext-dev-gone-provider',
      manifest: { type: 'ai' },
    });
    await expect(externalIntegration.setAiProvider('ext-dev-gone-provider')).to.be.rejectedWith(NotFoundError);
    expect(await variable.getValue(SYSTEM_VARIABLE_NAMES.AI_PROVIDER)).to.equal(null);
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

  it('should clear a selection written while the uninstall was running', async () => {
    // setAiProvider validated the row before the uninstall deleted it and
    // wrote the selector in the middle of the uninstall: the cleanup reads
    // the variable after the row deletion, so it catches that write too
    const { externalIntegration, variable, system } = buildSupervisor();
    const aiService = await seedAiService();
    const { getGladysBasePath } = system;
    system.getGladysBasePath = async () => {
      await externalIntegration.setAiProvider(aiService.selector);
      return getGladysBasePath();
    };
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
