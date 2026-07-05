const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const { EVENTS } = require('../../../../utils/constants');
const NetatmoHandler = require('../../../../services/netatmo/lib/index');

const gladys = {
  event: {
    emit: fake.resolves(null),
    removeListener: fake.returns(null),
  },
};
const serviceId = 'serviceId';
const netatmoHandler = new NetatmoHandler(gladys, serviceId);

describe('Netatmo Disconnect', () => {
  let clock;

  beforeEach(() => {
    sinon.reset();
    clock = sinon.useFakeTimers();
    netatmoHandler.status = 'not_initialized';
  });

  afterEach(() => {
    clock.restore();
    sinon.reset();
  });

  it('should properly disconnect from Netatmo', async () => {
    sinon.spy(clock, 'clearInterval');
    const intervalPollRefreshTokenSpy = sinon.spy();
    const intervalPollRefreshValuesSpy = sinon.spy();
    netatmoHandler.pollRefreshToken = setInterval(intervalPollRefreshTokenSpy, 3600 * 1000);
    netatmoHandler.pollRefreshValues = setInterval(intervalPollRefreshValuesSpy, 120 * 1000);
    netatmoHandler.setTokens = fake.resolves(true);
    netatmoHandler.dropWebhook = fake.resolves(true);

    await netatmoHandler.disconnect();

    sinon.assert.calledWith(
      netatmoHandler.gladys.event.removeListener,
      'gateway.new-message-netatmo-webhook',
      netatmoHandler.handleWebhookEventBound,
    );
    // the webhook is dropped while the access token is still valid
    expect(netatmoHandler.dropWebhook.calledOnce).to.equal(true);
    expect(netatmoHandler.dropWebhook.calledBefore(netatmoHandler.setTokens)).to.equal(true);
    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(2);
    expect(
      netatmoHandler.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'disconnecting' },
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(1).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'disconnected' },
      }),
    ).to.equal(true);

    clock.tick(3600 * 1000 * 2);
    assert.calledTwice(clock.clearInterval);
    expect(intervalPollRefreshTokenSpy.notCalled).to.equal(true);
    expect(intervalPollRefreshValuesSpy.notCalled).to.equal(true);
  });
});
