const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

const NodeRedManager = require('../../../../services/node-red/lib');

const container = {
  id: 'docker-test',
};

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

const mqtt = {
  end: fake.resolves(true),
  removeAllListeners: fake.resolves(true),
};

describe('NodeRed disconnect', () => {
  let nodeRedManager;
  let gladys;

  beforeEach(() => {
    gladys = {
      event: {
        emit: fake.resolves(null),
      },
      system: {
        getContainers: fake.resolves([container]),
        stopContainer: fake.resolves(true),
      },
    };

    nodeRedManager = new NodeRedManager(gladys, mqtt, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('stop container', async () => {
    await nodeRedManager.disconnect();

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NODERED.STATUS_CHANGE,
    });
    assert.calledTwice(gladys.event.emit);
    assert.called(gladys.system.stopContainer);

    expect(nodeRedManager.gladysConnected).to.equal(false);
    expect(nodeRedManager.nodeRedRunning).to.equal(false);
    expect(nodeRedManager.nodeRedExist).to.equal(false);
  });
});
