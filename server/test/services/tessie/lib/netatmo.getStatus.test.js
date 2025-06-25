const { expect } = require('chai');
const sinon = require('sinon');

const { fake } = sinon;

const { STATUS } = require('../../../../services/netatmo/lib/utils/netatmo.constants');
const NetatmoHandler = require('../../../../services/netatmo/lib/index');

const gladys = {
  event: {
    emit: fake.resolves(null),
  },
  stateManager: {
    get: sinon.stub().resolves(),
  },
};
const serviceId = 'serviceId';
const netatmoHandler = new NetatmoHandler(gladys, serviceId);

describe('Netatmo getStatus', () => {
  it('should return the current status of Netatmo handler', () => {
    netatmoHandler.configured = true;
    netatmoHandler.connected = false;
    netatmoHandler.status = STATUS.CONNECTED;

    const status = netatmoHandler.getStatus();

    expect(status).to.deep.equal({
      configured: true,
      connected: false,
      status: 'connected',
    });
  });
});
