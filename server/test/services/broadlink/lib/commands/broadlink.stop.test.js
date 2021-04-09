const sinon = require('sinon');
const { expect } = require('chai');

const { assert, fake } = sinon;
const BroadlinkHandler = require('../../../../../services/broadlink/lib');

describe('broadlink.stop', () => {
  const socket = {
    close: fake.returns(null),
  };
  const gladys = {};
  const broadlink = {
    sockets: [socket, socket],
    removeAllListeners: fake.returns(true),
  };
  const serviceId = 'service-id';

  const broadlinkHandler = new BroadlinkHandler(gladys, broadlink, serviceId);

  beforeEach(() => {
    broadlinkHandler.handlers = [0, 1];
    broadlinkHandler.peripherals = {
      0: {},
      1: {},
    };
    broadlinkHandler.broadlinkDevices = {
      0: {},
      1: {},
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should clean all', () => {
    broadlinkHandler.stop();

    expect(broadlinkHandler.handlers).to.deep.eq([]);
    expect(broadlinkHandler.peripherals).to.deep.eq({});
    expect(broadlinkHandler.broadlinkDevices).to.deep.eq({});
    assert.calledOnce(broadlink.removeAllListeners);
    // Called twice, as we add it twice
    assert.calledTwice(socket.close);
  });
});
