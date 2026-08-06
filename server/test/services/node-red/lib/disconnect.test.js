const { expect } = require('chai');
const path = require('path');
const sinon = require('sinon');
const proxiquire = require('proxyquire').noCallThru();

const { assert, fake } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { DEFAULT } = require('../../../../services/node-red/lib/constants');

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
  name: '/gladys-node-red',
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
    // Container name resolved and persisted at init
    nodeRedManager.getConfiguration = fake.resolves({ nodeRedContainerName: 'gladys-node-red' });
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

  it('should not touch any container when the name was never persisted', async () => {
    nodeRedManager.getConfiguration = fake.resolves({ nodeRedContainerName: undefined });

    await nodeRedManager.disconnect();

    // A foreign homonym container must never be looked up, stopped or removed
    assert.notCalled(gladys.system.getContainers);
    assert.notCalled(gladys.system.stopContainer);
    assert.notCalled(gladys.system.removeContainer);
    // Config folder cleanup and flags still run
    expect(nodeRedManager.nodeRedRunning).to.equal(false);
    expect(nodeRedManager.gladysConnected).to.equal(false);
  });

  it('should not crash when the persisted container is already gone', async () => {
    // Name is persisted but the container no longer exists
    gladys.system.getContainers = fake.resolves([]);

    await nodeRedManager.disconnect();

    assert.called(gladys.system.getContainers);
    assert.notCalled(gladys.system.stopContainer);
    assert.notCalled(gladys.system.removeContainer);
    // The config cleanup and flag reset must still run even though no container was stopped
    assert.calledOnceWithExactly(fsMock.rm, path.dirname(path.join(TEMP_GLADYS_FOLDER, DEFAULT.CONFIGURATION_PATH)), {
      recursive: true,
    });
    expect(nodeRedManager.nodeRedRunning).to.equal(false);
    expect(nodeRedManager.gladysConnected).to.equal(false);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NODERED.STATUS_CHANGE,
    });
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
