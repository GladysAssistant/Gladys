const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { Error422 } = require('../../../utils/httpErrors');
const getConfig = require('../../../utils/getConfig');
const { buildSupervisor, seedExternalService, TEST_WEBHOOKS_MANIFEST } = require('./testUtils.test');
const { OPEN_API_KEY_CONFIG_KEY, MAX_WEBHOOK_BODY_BYTES } = require('../../../lib/external-integration/constants');

const { gladysGatewayServerUrl } = getConfig();

const seedWebhooksService = (overrides = {}) => seedExternalService({ manifest: TEST_WEBHOOKS_MANIFEST, ...overrides });

describe('externalIntegration webhooks (Gladys Plus relay)', () => {
  it('should register the gateway webhook listeners at construction', async () => {
    const { event } = buildSupervisor();
    const registeredEvents = event.on.getCalls().map((call) => call.args[0]);
    expect(registeredEvents).to.include(EVENTS.GATEWAY.NEW_MESSAGE_EXTERNAL_INTEGRATION_WEBHOOK);
    expect(registeredEvents).to.include(EVENTS.GATEWAY.LINK_STATUS_CHANGED);
  });

  describe('externalIntegration.getWebhooks', () => {
    it('should return unavailable without any declared webhook', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedExternalService();
      const result = await externalIntegration.getWebhooks(service);
      expect(result).to.deep.equal({ available: false, webhooks: [] });
    });

    it('should return unavailable webhooks (null URLs) without the Open API key', async () => {
      const { externalIntegration, variable } = buildSupervisor();
      const service = await seedWebhooksService();
      // Plus linked but no key pasted yet
      await variable.setValue('GLADYS_GATEWAY_REFRESH_TOKEN', 'refresh-token');
      const result = await externalIntegration.getWebhooks(service);
      expect(result).to.deep.equal({
        available: false,
        webhooks: [
          { key: 'events', mode: 'fire_and_forget', url: null },
          { key: 'callback', mode: 'sync', url: null },
        ],
      });
    });

    it('should return unavailable webhooks when Gladys Plus is not linked, even with a key', async () => {
      const { externalIntegration, variable } = buildSupervisor();
      const service = await seedWebhooksService();
      await variable.setValue(OPEN_API_KEY_CONFIG_KEY, JSON.stringify('my-open-api-key'), service.id);
      const result = await externalIntegration.getWebhooks(service);
      expect(result.available).to.equal(false);
      expect(result.webhooks[0].url).to.equal(null);
    });

    it('should build the full webhook URLs when Plus is linked and the key is set', async () => {
      const { externalIntegration, variable } = buildSupervisor();
      const service = await seedWebhooksService();
      await variable.setValue('GLADYS_GATEWAY_REFRESH_TOKEN', 'refresh-token');
      await variable.setValue(OPEN_API_KEY_CONFIG_KEY, JSON.stringify('my-open-api-key'), service.id);
      const result = await externalIntegration.getWebhooks(service);
      expect(result).to.deep.equal({
        available: true,
        webhooks: [
          {
            key: 'events',
            mode: 'fire_and_forget',
            url: `${gladysGatewayServerUrl}/v1/api/external-integration/my-open-api-key/${service.selector}/events`,
          },
          {
            key: 'callback',
            mode: 'sync',
            url: `${gladysGatewayServerUrl}/v1/api/external-integration/my-open-api-key/${service.selector}/callback`,
          },
        ],
      });
    });
  });

  describe('externalIntegration.handleGatewayWebhook', () => {
    it('should answer a silent empty 200 for an unknown selector', async () => {
      const { externalIntegration } = buildSupervisor();
      externalIntegration.sendMessage = fake.returns(true);
      externalIntegration.sendCommand = fake.resolves({});
      const cb = fake.returns(null);
      await externalIntegration.handleGatewayWebhook(
        { selector: 'ext-unknown', webhook_key: 'events', method: 'POST' },
        cb,
      );
      assert.calledOnceWithExactly(cb, { status: 200 });
      assert.notCalled(externalIntegration.sendMessage);
      assert.notCalled(externalIntegration.sendCommand);
    });

    it('should answer a silent empty 200 without data at all', async () => {
      const { externalIntegration } = buildSupervisor();
      externalIntegration.sendMessage = fake.returns(true);
      const cb = fake.returns(null);
      await externalIntegration.handleGatewayWebhook(undefined, cb);
      assert.calledOnceWithExactly(cb, { status: 200 });
      assert.notCalled(externalIntegration.sendMessage);
    });

    it('should answer a silent empty 200 for an undeclared webhook key', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedWebhooksService();
      externalIntegration.sendMessage = fake.returns(true);
      const cb = fake.returns(null);
      await externalIntegration.handleGatewayWebhook(
        { selector: service.selector, webhook_key: 'not_declared', method: 'POST' },
        cb,
      );
      assert.calledOnceWithExactly(cb, { status: 200 });
      assert.notCalled(externalIntegration.sendMessage);
    });

    it('should ack 200 immediately and relay a fire-and-forget webhook without ack', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedWebhooksService();
      externalIntegration.sendMessage = fake.returns(true);
      const cb = fake.returns(null);
      await externalIntegration.handleGatewayWebhook(
        {
          selector: service.selector,
          webhook_key: 'events',
          method: 'POST',
          query: { token: 'abc' },
          body: { push_type: 'webhook_activation' },
          content_type: 'application/json',
        },
        cb,
      );
      assert.calledOnceWithExactly(cb, { status: 200 });
      assert.calledOnce(externalIntegration.sendMessage);
      const [sentService, type, payload] = externalIntegration.sendMessage.firstCall.args;
      expect(sentService.id).to.equal(service.id);
      expect(type).to.equal(WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.WEBHOOK_RECEIVED);
      expect(payload).to.deep.equal({
        webhook_key: 'events',
        method: 'POST',
        query: { token: 'abc' },
        body: { push_type: 'webhook_activation' },
        content_type: 'application/json',
      });
    });

    it('should relay a fire-and-forget webhook without body', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedWebhooksService();
      externalIntegration.sendMessage = fake.returns(true);
      const cb = fake.returns(null);
      await externalIntegration.handleGatewayWebhook({ selector: service.selector, webhook_key: 'events' }, cb);
      assert.calledOnceWithExactly(cb, { status: 200 });
      assert.calledOnce(externalIntegration.sendMessage);
    });

    it('should drop an oversized body with an empty 200', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedWebhooksService();
      externalIntegration.sendMessage = fake.returns(true);
      const cb = fake.returns(null);
      await externalIntegration.handleGatewayWebhook(
        { selector: service.selector, webhook_key: 'events', body: 'a'.repeat(MAX_WEBHOOK_BODY_BYTES + 1) },
        cb,
      );
      assert.calledOnceWithExactly(cb, { status: 200 });
      assert.notCalled(externalIntegration.sendMessage);
    });

    it('should survive a callback that throws', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedWebhooksService();
      externalIntegration.sendMessage = fake.returns(true);
      const cb = () => {
        throw new Error('gateway went away');
      };
      await externalIntegration.handleGatewayWebhook({ selector: service.selector, webhook_key: 'events' }, cb);
      assert.calledOnce(externalIntegration.sendMessage);
    });

    it('should relay the integration response of a sync webhook to the caller', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedWebhooksService();
      externalIntegration.sendCommand = fake.resolves({
        data: { status: 200, content_type: 'text/plain', body: 'hub.challenge-value' },
      });
      const cb = fake.returns(null);
      await externalIntegration.handleGatewayWebhook(
        {
          selector: service.selector,
          webhook_key: 'callback',
          method: 'GET',
          query: { challenge: 'hub.challenge-value' },
          body: '',
          content_type: null,
        },
        cb,
      );
      assert.calledOnce(externalIntegration.sendCommand);
      const [, type, payload] = externalIntegration.sendCommand.firstCall.args;
      expect(type).to.equal(WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.WEBHOOK_REQUEST);
      expect(payload.webhook_key).to.equal('callback');
      assert.calledOnceWithExactly(cb, { status: 200, content_type: 'text/plain', body: 'hub.challenge-value' });
    });

    it('should default a minimal sync response to an empty 200', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedWebhooksService();
      externalIntegration.sendCommand = fake.resolves({});
      const cb = fake.returns(null);
      await externalIntegration.handleGatewayWebhook({ selector: service.selector, webhook_key: 'callback' }, cb);
      assert.calledOnceWithExactly(cb, { status: 200 });
    });

    it('should fall back to an empty 200 on out-of-contract sync responses', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedWebhooksService();
      const cb = fake.returns(null);
      // 5xx would let the integration make Gladys Plus look broken
      externalIntegration.sendCommand = fake.resolves({ data: { status: 500 } });
      await externalIntegration.handleGatewayWebhook({ selector: service.selector, webhook_key: 'callback' }, cb);
      // non-string content type
      externalIntegration.sendCommand = fake.resolves({ data: { status: 200, content_type: 42 } });
      await externalIntegration.handleGatewayWebhook({ selector: service.selector, webhook_key: 'callback' }, cb);
      // oversized response body
      externalIntegration.sendCommand = fake.resolves({ data: { body: 'a'.repeat(64 * 1024 + 1) } });
      await externalIntegration.handleGatewayWebhook({ selector: service.selector, webhook_key: 'callback' }, cb);
      expect(cb.getCalls().map((call) => call.args[0])).to.deep.equal([
        { status: 200 },
        { status: 200 },
        { status: 200 },
      ]);
    });

    it('should answer an empty 200 when the sync command fails (stopped integration, ack timeout)', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedWebhooksService();
      externalIntegration.sendCommand = fake.rejects(new Error('EXTERNAL_INTEGRATION_NOT_CONNECTED'));
      const cb = fake.returns(null);
      await externalIntegration.handleGatewayWebhook({ selector: service.selector, webhook_key: 'callback' }, cb);
      assert.calledOnceWithExactly(cb, { status: 200 });
    });
  });

  describe('externalIntegration.notifyWebhookAvailability', () => {
    it('should push the fresh availability to the integrations declaring webhooks only', async () => {
      const { externalIntegration, variable } = buildSupervisor();
      await seedExternalService();
      const webhooksService = await seedWebhooksService({
        name: 'ext-dev-netatmo-demo',
        selector: 'ext-dev-netatmo-demo',
      });
      await variable.setValue('GLADYS_GATEWAY_REFRESH_TOKEN', 'refresh-token');
      await variable.setValue(OPEN_API_KEY_CONFIG_KEY, JSON.stringify('my-key'), webhooksService.id);
      externalIntegration.sendMessage = fake.returns(true);
      await externalIntegration.notifyWebhookAvailability();
      assert.calledOnce(externalIntegration.sendMessage);
      const [sentService, type, payload] = externalIntegration.sendMessage.firstCall.args;
      expect(sentService.id).to.equal(webhooksService.id);
      expect(type).to.equal(WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.WEBHOOK_UPDATED);
      expect(payload.available).to.equal(true);
      expect(payload.webhooks).to.have.lengthOf(2);
    });
  });

  describe('GLADYS_OPEN_API_KEY reserved config secret', () => {
    it('should save the key from the front and push the new webhook URLs', async () => {
      const { externalIntegration, variable } = buildSupervisor();
      const service = await seedWebhooksService();
      await variable.setValue('GLADYS_GATEWAY_REFRESH_TOKEN', 'refresh-token');
      externalIntegration.sendMessage = fake.returns(true);
      const result = await externalIntegration.saveConfigFromFront(service.selector, {
        [OPEN_API_KEY_CONFIG_KEY]: 'my-open-api-key',
      });
      // secret semantics: never echoed back, only the configured flag
      expect(result.config[OPEN_API_KEY_CONFIG_KEY]).to.equal(null);
      expect(result.configured_secrets).to.include(OPEN_API_KEY_CONFIG_KEY);
      const fullConfig = await externalIntegration.getIntegrationConfig(service);
      expect(fullConfig[OPEN_API_KEY_CONFIG_KEY]).to.equal('my-open-api-key');
      const types = externalIntegration.sendMessage.getCalls().map((call) => call.args[1]);
      expect(types).to.include(WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.CONFIG_UPDATED);
      expect(types).to.include(WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.WEBHOOK_UPDATED);
      const webhookPush = externalIntegration.sendMessage
        .getCalls()
        .find((call) => call.args[1] === WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.WEBHOOK_UPDATED);
      expect(webhookPush.args[2].available).to.equal(true);
    });

    it('should leave the key unchanged when null, without any webhook push', async () => {
      const { externalIntegration, variable } = buildSupervisor();
      const service = await seedWebhooksService();
      await variable.setValue(OPEN_API_KEY_CONFIG_KEY, JSON.stringify('existing-key'), service.id);
      externalIntegration.sendMessage = fake.returns(true);
      await externalIntegration.saveConfigFromFront(service.selector, { [OPEN_API_KEY_CONFIG_KEY]: null });
      const fullConfig = await externalIntegration.getIntegrationConfig(service);
      expect(fullConfig[OPEN_API_KEY_CONFIG_KEY]).to.equal('existing-key');
      const types = externalIntegration.sendMessage.getCalls().map((call) => call.args[1]);
      expect(types).to.not.include(WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.WEBHOOK_UPDATED);
    });

    it('should reject a malformed key', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedWebhooksService();
      await expect(
        externalIntegration.saveConfigFromFront(service.selector, { [OPEN_API_KEY_CONFIG_KEY]: '' }),
      ).to.be.rejectedWith(Error422);
      await expect(
        externalIntegration.saveConfigFromFront(service.selector, { [OPEN_API_KEY_CONFIG_KEY]: 42 }),
      ).to.be.rejectedWith(Error422);
    });

    it('should reject the key when the manifest declares no webhook', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedExternalService();
      await expect(
        externalIntegration.saveConfigFromFront(service.selector, { [OPEN_API_KEY_CONFIG_KEY]: 'my-key' }),
      ).to.be.rejectedWith(Error422);
    });

    it('should expose the key slot in the front config only when webhooks are declared', async () => {
      const { externalIntegration } = buildSupervisor();
      const webhooksService = await seedWebhooksService();
      const deviceService = await seedExternalService({
        name: 'ext-dev-no-webhooks',
        selector: 'ext-dev-no-webhooks',
      });
      const frontConfig = await externalIntegration.getConfigForFront(webhooksService.selector);
      expect(frontConfig.config).to.have.property(OPEN_API_KEY_CONFIG_KEY, null);
      expect(frontConfig.configured_secrets).to.not.include(OPEN_API_KEY_CONFIG_KEY);
      const deviceFrontConfig = await externalIntegration.getConfigForFront(deviceService.selector);
      expect(deviceFrontConfig.config).to.not.have.property(OPEN_API_KEY_CONFIG_KEY);
    });
  });
});
