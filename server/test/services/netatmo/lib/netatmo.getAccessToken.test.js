const { expect } = require('chai');
const sinon = require('sinon');

const { fake } = sinon;

const { EVENTS } = require('../../../../utils/constants');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const NetatmoHandler = require('../../../../services/netatmo/lib/index');

const gladys = {
  event: {
    emit: fake.resolves(null),
  },
  variable: {
    getValue: fake.returns('valid_access_token'),
    setValue: sinon.stub().resolves(),
  },
};
const serviceId = 'serviceId';
const netatmoHandler = new NetatmoHandler(gladys, serviceId);

describe('getAccessToken', () => {
  beforeEach(() => {
    sinon.reset();

    netatmoHandler.status = 'not_initialized';
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should load the access token if available', async () => {
    const accessToken = await netatmoHandler.getAccessToken();
    expect(accessToken).to.equal('valid_access_token');
  });

  it('should return undefined and disconnect if no access token is available', async () => {
    netatmoHandler.gladys.variable.getValue = fake.returns(null);

    const accessToken = await netatmoHandler.getAccessToken();
    expect(accessToken).to.equal(undefined);
    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(1);
    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(1);
    expect(
      netatmoHandler.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'disconnected' },
      }),
    ).to.equal(true);
  });

  it('should throw an error if not configured', async () => {
    netatmoHandler.gladys.variable.getValue = fake.rejects(new Error('Test error'));

    try {
      await netatmoHandler.getAccessToken();
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(netatmoHandler.gladys.event.emit.callCount).to.equal(1);
      expect(
        netatmoHandler.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
          type: 'netatmo.status',
          payload: { status: 'not_initialized' },
        }),
      ).to.equal(true);
      expect(e).to.be.instanceOf(ServiceNotConfiguredError);
      expect(e.message).to.equal('Netatmo is not configured.');
    }
  });
});
