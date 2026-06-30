const { expect } = require('chai');
const sinon = require('sinon');

const { fake } = sinon;

const NetatmoHandler = require('../../../../services/netatmo/lib/index');

const gladys = {
  event: {
    emit: fake.resolves(null),
  },
  variable: {
    setValue: fake.resolves(null),
  },
};
const serviceId = 'serviceId';

describe('Netatmo handleApiAuthError', () => {
  let netatmoHandler;
  let clock;

  beforeEach(() => {
    sinon.reset();
    clock = sinon.useFakeTimers();
    netatmoHandler = new NetatmoHandler(gladys, serviceId);
    netatmoHandler.accessToken = 'valid_access_token';
    netatmoHandler.refreshToken = 'valid_refresh_token';
    netatmoHandler.configuration = {
      clientId: 'valid_client_id',
      clientSecret: 'valid_client_secret',
      scopes: { scopeEnergy: 'scope' },
    };
  });

  afterEach(() => {
    clearTimeout(netatmoHandler.reconnectTimeout);
    clock.restore();
    sinon.reset();
  });

  it('should return false for non auth statuses (200)', () => {
    const result = netatmoHandler.handleApiAuthError(200);
    expect(result).to.equal(false);
  });

  it('should return false for non auth statuses (500)', () => {
    const result = netatmoHandler.handleApiAuthError(500);
    expect(result).to.equal(false);
  });

  it('should trigger reconnect cycle and switch to RECONNECTING on 401', () => {
    const spy = sinon.spy(netatmoHandler, 'scheduleReconnectAttempt');
    const result = netatmoHandler.handleApiAuthError(401);
    expect(result).to.equal(true);
    expect(netatmoHandler.status).to.equal('reconnecting');
    expect(spy.calledOnce).to.equal(true);
    expect(netatmoHandler.reconnectAttempt).to.equal(1);
    spy.restore();
  });

  it('should trigger reconnect cycle on 403', () => {
    const spy = sinon.spy(netatmoHandler, 'scheduleReconnectAttempt');
    const result = netatmoHandler.handleApiAuthError(403);
    expect(result).to.equal(true);
    expect(netatmoHandler.status).to.equal('reconnecting');
    expect(spy.calledOnce).to.equal(true);
    spy.restore();
  });

  it('should trigger reconnect cycle on 406 (Application is deactivated)', () => {
    const spy = sinon.spy(netatmoHandler, 'scheduleReconnectAttempt');
    const result = netatmoHandler.handleApiAuthError(406);
    expect(result).to.equal(true);
    expect(netatmoHandler.status).to.equal('reconnecting');
    expect(spy.calledOnce).to.equal(true);
    spy.restore();
  });

  it('should be idempotent when a reconnect is already in progress', () => {
    netatmoHandler.reconnectAttempt = 2;
    const spy = sinon.spy(netatmoHandler, 'scheduleReconnectAttempt');
    const result = netatmoHandler.handleApiAuthError(401);
    expect(result).to.equal(false);
    expect(spy.called).to.equal(false);
    spy.restore();
  });

  it('should still flip status to RECONNECTING even when idempotent (no new schedule)', () => {
    netatmoHandler.reconnectAttempt = 1;
    netatmoHandler.status = 'connected';
    const spy = sinon.spy(netatmoHandler, 'scheduleReconnectAttempt');
    const result = netatmoHandler.handleApiAuthError(406);
    expect(result).to.equal(false);
    expect(spy.called).to.equal(false);
    expect(netatmoHandler.status).to.equal('reconnecting');
    spy.restore();
  });
});
