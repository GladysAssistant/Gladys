const { expect } = require('chai');
const sinon = require('sinon');

const { fake } = sinon;

const webhookEventMock = require('../netatmo.webhookEvent.mock.test.json');
const NetatmoHandler = require('../../../../services/netatmo/lib/index');

const gladys = {
  event: {
    emit: fake.resolves(null),
  },
};
const serviceId = 'serviceId';
const netatmoHandler = new NetatmoHandler(gladys, serviceId);

describe('Netatmo Handle Webhook Event', () => {
  let clock;

  beforeEach(() => {
    sinon.reset();
    clock = sinon.useFakeTimers();

    netatmoHandler.status = 'connected';
    netatmoHandler.configuration.energyApi = true;
    netatmoHandler.webhookRegistered = false;
    netatmoHandler.webhookRefreshTimeout = undefined;
    netatmoHandler.refreshNetatmoValues = fake.resolves(null);
  });

  afterEach(() => {
    clock.restore();
    sinon.reset();
  });

  it('should ignore a malformed message', async () => {
    await netatmoHandler.handleWebhookEvent(undefined);
    await netatmoHandler.handleWebhookEvent({ user_id: 'user' });
    await netatmoHandler.handleWebhookEvent({ user_id: 'user', netatmo_data: 'not-an-object' });

    await clock.tickAsync(10 * 1000);
    sinon.assert.notCalled(netatmoHandler.refreshNetatmoValues);
  });

  it('should ignore events when the service is not connected', async () => {
    netatmoHandler.status = 'disconnected';

    await netatmoHandler.handleWebhookEvent(JSON.parse(JSON.stringify(webhookEventMock)));

    await clock.tickAsync(10 * 1000);
    sinon.assert.notCalled(netatmoHandler.refreshNetatmoValues);
  });

  it('should ignore events when the Energy API is disabled', async () => {
    netatmoHandler.configuration.energyApi = false;

    await netatmoHandler.handleWebhookEvent(JSON.parse(JSON.stringify(webhookEventMock)));

    await clock.tickAsync(10 * 1000);
    sinon.assert.notCalled(netatmoHandler.refreshNetatmoValues);
  });

  it('should flag the webhook as registered on the activation event', async () => {
    const message = JSON.parse(JSON.stringify(webhookEventMock));
    message.netatmo_data = { event_type: 'webhook_activation', push_type: 'webhook_activation' };

    await netatmoHandler.handleWebhookEvent(message);

    expect(netatmoHandler.webhookRegistered).to.equal(true);
    await clock.tickAsync(10 * 1000);
    sinon.assert.notCalled(netatmoHandler.refreshNetatmoValues);
  });

  it('should ignore non-energy event types without throwing', async () => {
    const message = JSON.parse(JSON.stringify(webhookEventMock));
    message.netatmo_data.event_type = 'movement';

    await netatmoHandler.handleWebhookEvent(message);

    await clock.tickAsync(10 * 1000);
    sinon.assert.notCalled(netatmoHandler.refreshNetatmoValues);
  });

  it('should refresh the devices values once after an energy event', async () => {
    await netatmoHandler.handleWebhookEvent(JSON.parse(JSON.stringify(webhookEventMock)));

    sinon.assert.notCalled(netatmoHandler.refreshNetatmoValues);
    await clock.tickAsync(2 * 1000);
    sinon.assert.calledOnce(netatmoHandler.refreshNetatmoValues);
  });

  it('should coalesce a burst of energy events into a single refresh', async () => {
    const eventTypes = ['set_point', 'set_point', 'therm_mode', 'schedule', 'cancel_set_point'];
    // eslint-disable-next-line no-restricted-syntax
    for (const eventType of eventTypes) {
      const message = JSON.parse(JSON.stringify(webhookEventMock));
      message.netatmo_data.event_type = eventType;
      // eslint-disable-next-line no-await-in-loop
      await netatmoHandler.handleWebhookEvent(message);
      // eslint-disable-next-line no-await-in-loop
      await clock.tickAsync(500);
    }

    await clock.tickAsync(10 * 1000);
    sinon.assert.calledOnce(netatmoHandler.refreshNetatmoValues);
  });

  it('should catch a refresh failure after an energy event', async () => {
    netatmoHandler.refreshNetatmoValues = fake.rejects(new Error('refresh error'));

    await netatmoHandler.handleWebhookEvent(JSON.parse(JSON.stringify(webhookEventMock)));

    await clock.tickAsync(10 * 1000);
    sinon.assert.calledOnce(netatmoHandler.refreshNetatmoValues);
  });
});
