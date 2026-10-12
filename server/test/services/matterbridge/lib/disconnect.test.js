const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const { assert, fake } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

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
  labels: { 'io.gladysassistant.service': 'matterbridge' },
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
        inspectContainer: fake.resolves({ Config: { Image: 'nginx:alpine' } }),
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

  it('no container to stop', async () => {
    gladys.system.getContainers = fake.resolves([]);

    await matterbridgeManager.disconnect();

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MATTERBRIDGE.STATUS_CHANGE,
    });
    assert.notCalled(gladys.system.stopContainer);
    assert.notCalled(gladys.system.removeContainer);
    assert.notCalled(fsMock.rm);

    expect(matterbridgeManager.matterbridgeRunning).to.equal(true);
  });

  it('our name is taken by a user container -> it is left untouched', async () => {
    gladys.system.getContainers = fake.resolves([
      { id: 'user-container', name: '/gladys-matterbridge', image: 'nginx' },
    ]);

    await matterbridgeManager.disconnect();

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MATTERBRIDGE.STATUS_CHANGE,
    });
    assert.calledOnceWithExactly(gladys.system.inspectContainer, 'user-container');
    assert.notCalled(gladys.system.stopContainer);
    assert.notCalled(gladys.system.removeContainer);
    assert.notCalled(fsMock.rm);

    expect(matterbridgeManager.matterbridgeRunning).to.equal(true);
  });
});
