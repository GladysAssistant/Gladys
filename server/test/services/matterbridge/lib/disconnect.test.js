const { expect } = require('chai');
const path = require('path');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { assert, fake } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { DEFAULT } = require('../../../../services/matterbridge/lib/constants');

const fsMock = {
  rm: fake.resolves(true),
};

const disconnect = proxyquire('../../../../services/matterbridge/lib/disconnect', {
  'fs/promises': fsMock,
});

const MatterbridgeManager = proxyquire('../../../../services/matterbridge/lib', {
  './disconnect': disconnect,
});

const container = {
  id: 'docker-test',
  name: '/gladys-matterbridge',
};

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

const TEMP_GLADYS_FOLDER = process.env.TEMP_FOLDER || '../.tmp';

describe('Matterbridge disconnect', () => {
  let matterbridgeManager;
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

    matterbridgeManager = new MatterbridgeManager(gladys, serviceId);
    matterbridgeManager.matterbridgeRunning = true;
    matterbridgeManager.matterbridgeExist = true;
    // Container name resolved and persisted at init
    matterbridgeManager.getConfiguration = fake.resolves({ matterbridgeContainerName: 'gladys-matterbridge' });
  });

  afterEach(() => {
    sinon.reset();
  });

  it('stop container', async () => {
    await matterbridgeManager.disconnect();

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MATTERBRIDGE.STATUS_CHANGE,
    });
    assert.called(gladys.event.emit);
    assert.called(gladys.system.stopContainer);
    assert.called(gladys.system.removeContainer);

    expect(matterbridgeManager.matterbridgeRunning).to.equal(false);
    expect(matterbridgeManager.matterbridgeExist).to.equal(true);
  });

  it('should not touch any container when the name was never persisted', async () => {
    matterbridgeManager.getConfiguration = fake.resolves({ matterbridgeContainerName: undefined });

    await matterbridgeManager.disconnect();

    assert.notCalled(gladys.system.getContainers);
    assert.notCalled(gladys.system.stopContainer);
    assert.notCalled(gladys.system.removeContainer);
    expect(matterbridgeManager.matterbridgeRunning).to.equal(false);
  });

  it('should not crash when the persisted container is already gone', async () => {
    // Name is persisted but the container no longer exists
    gladys.system.getContainers = fake.resolves([]);

    await matterbridgeManager.disconnect();

    assert.called(gladys.system.getContainers);
    assert.notCalled(gladys.system.stopContainer);
    assert.notCalled(gladys.system.removeContainer);
    // The config cleanup and flag reset must still run even though no container was stopped
    assert.calledOnceWithExactly(fsMock.rm, path.join(TEMP_GLADYS_FOLDER, DEFAULT.CONFIGURATION_PATH), {
      recursive: true,
    });
    expect(matterbridgeManager.matterbridgeRunning).to.equal(false);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MATTERBRIDGE.STATUS_CHANGE,
    });
  });

  it('stop container failed', async () => {
    gladys.system.stopContainer = fake.rejects('Error');

    await matterbridgeManager.disconnect();

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MATTERBRIDGE.STATUS_CHANGE,
    });
    assert.called(gladys.event.emit);
    assert.called(gladys.system.stopContainer);

    expect(matterbridgeManager.matterbridgeRunning).to.equal(true);
    expect(matterbridgeManager.matterbridgeExist).to.equal(true);
  });

  it('remove container failed', async () => {
    gladys.system.removeContainer = fake.rejects('Error');

    await matterbridgeManager.disconnect();

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MATTERBRIDGE.STATUS_CHANGE,
    });
    assert.called(gladys.event.emit);
    assert.called(gladys.system.stopContainer);
    assert.called(gladys.system.removeContainer);

    expect(matterbridgeManager.matterbridgeRunning).to.equal(true);
    expect(matterbridgeManager.matterbridgeExist).to.equal(true);
  });
});
