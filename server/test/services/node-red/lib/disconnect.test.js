const { expect } = require('chai');
const sinon = require('sinon');
const proxiquire = require('proxyquire').noCallThru();

const { assert, fake } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

const fsMock = {
  rm: fake.resolves(true),
};

const disconnect = proxiquire('../../../../services/node-red/lib/disconnect', {
  'fs/promises': fsMock,
});

const NodeRedManager = proxiquire('../../../../services/node-red/lib', {
  './disconnect': disconnect,
});

const container = {
  id: 'docker-test',
};

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

const mqtt = {
  end: fake.resolves(true),
  removeAllListeners: fake.resolves(true),
};

const TEMP_GLADYS_FOLDER = process.env.TEMP_FOLDER || '../.tmp';

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
        removeContainer: fake.resolves(true),
        getGladysBasePath: fake.resolves({
          basePathOnHost: TEMP_GLADYS_FOLDER,
          basePathOnContainer: TEMP_GLADYS_FOLDER,
        }),
      },
    };

    nodeRedManager = new NodeRedManager(gladys, mqtt, serviceId);
    nodeRedManager.gladysConnected = true;
    nodeRedManager.nodeRedRunning = true;
    nodeRedManager.nodeRedExist = true;
  });

  afterEach(() => {
    sinon.reset();
  });

  it('stop container', async () => {
    await nodeRedManager.disconnect();

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NODERED.STATUS_CHANGE,
    });
    assert.called(gladys.event.emit);
    assert.called(gladys.system.stopContainer);
    assert.called(gladys.system.removeContainer);

    expect(nodeRedManager.gladysConnected).to.equal(false);
    expect(nodeRedManager.nodeRedRunning).to.equal(false);
    expect(nodeRedManager.nodeRedExist).to.equal(true);
  });

  it('stop container failed', async () => {
    gladys.system.stopContainer = fake.rejects('Error');

    await nodeRedManager.disconnect();

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NODERED.STATUS_CHANGE,
    });
    assert.called(gladys.event.emit);
    assert.called(gladys.system.stopContainer);

    expect(nodeRedManager.gladysConnected).to.equal(true);
    expect(nodeRedManager.nodeRedRunning).to.equal(true);
    expect(nodeRedManager.nodeRedExist).to.equal(true);
  });

  it('remove container failed', async () => {
    gladys.system.removeContainer = fake.rejects('Error');

    await nodeRedManager.disconnect();

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NODERED.STATUS_CHANGE,
    });
    assert.called(gladys.event.emit);
    assert.called(gladys.system.stopContainer);
    assert.called(gladys.system.removeContainer);

    expect(nodeRedManager.gladysConnected).to.equal(true);
    expect(nodeRedManager.nodeRedRunning).to.equal(true);
    expect(nodeRedManager.nodeRedExist).to.equal(true);
  });
});
