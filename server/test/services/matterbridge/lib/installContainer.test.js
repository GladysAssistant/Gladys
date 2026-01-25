const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const MatterbridgeManager = require('../../../../services/matterbridge/lib');

const container = {
  id: 'docker-test',
  state: 'running',
};

const config = {};

const containerStopped = {
  id: 'docker-test',
  state: 'stopped',
};

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('Matterbridge installContainer', () => {
  const TEMP_GLADYS_FOLDER = process.env.TEMP_FOLDER || '../.tmp';
  // PREPARE
  let matterbridgeManager;
  let gladys;

  beforeEach(() => {
    gladys = {
      event: {
        emit: fake.resolves(null),
      },
      system: {
        isDocker: fake.resolves(true),
        getNetworkMode: fake.resolves('host'),
        getContainers: fake.resolves([containerStopped]),
        stopContainer: fake.resolves(true),
        pull: fake.resolves(true),
        restartContainer: fake.resolves(true),
        createContainer: fake.resolves(true),
        exec: fake.resolves(true),
        getGladysBasePath: fake.resolves({
          basePathOnHost: TEMP_GLADYS_FOLDER,
          basePathOnContainer: TEMP_GLADYS_FOLDER,
        }),
      },
      variable: {
        getValue: fake.resolves('1'),
      },
    };

    matterbridgeManager = new MatterbridgeManager(gladys, serviceId);
    matterbridgeManager.matterbridgeRunning = false;
    matterbridgeManager.matterbridgeExist = false;
    matterbridgeManager.containerRestartWaitTimeInMs = 0;
    matterbridgeManager.configureContainer = fake.resolves(false);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should create container', async function Test() {
    matterbridgeManager.configureContainer = fake.resolves(true);
    const getContainers = sinon.stub();
    getContainers.onCall(0).resolves([]);
    getContainers.onCall(1).resolves([containerStopped]);

    gladys.system.getContainers = getContainers;
    this.timeout(6000);

    await matterbridgeManager.installContainer(config);

    assert.calledWith(gladys.system.pull, 'luligu/matterbridge:latest');
    assert.calledOnce(gladys.system.createContainer);

    const createContainerCall = gladys.system.createContainer.firstCall.args[0];
    expect(createContainerCall.name).to.equal('gladys-matterbridge');
    expect(createContainerCall.Image).to.equal('luligu/matterbridge:latest');
    expect(createContainerCall.HostConfig.Binds).to.deep.equal([
      '../.tmp/matterbridge/Matterbridge:/root/Matterbridge',
      '../.tmp/matterbridge/.matterbridge:/root/.matterbridge',
      '../.tmp/matterbridge/.mattercert:/root/.mattercert',
    ]);
    expect(createContainerCall.HostConfig.NetworkMode).to.equal('host');

    assert.calledWith(gladys.system.restartContainer, containerStopped.id);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MATTERBRIDGE.STATUS_CHANGE,
    });
    expect(matterbridgeManager.matterbridgeRunning).to.equal(true);
    expect(matterbridgeManager.matterbridgeExist).to.equal(true);
  });

  it('should failed when create container failed', async function Test() {
    const getContainers = sinon.stub();
    getContainers.onCall(0).resolves([]);
    getContainers.onCall(1).resolves([container]);
    gladys.system.pull = fake.rejects('Error');

    gladys.system.getContainers = getContainers;
    this.timeout(6000);

    try {
      await matterbridgeManager.installContainer();
      assert.fail();
    } catch (e) {
      expect(e.message).to.equal('Error');
    }

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MATTERBRIDGE.STATUS_CHANGE,
    });
    expect(matterbridgeManager.matterbridgeRunning).to.equal(false);
    expect(matterbridgeManager.matterbridgeExist).to.equal(false);
  });

  it('should restart container', async function Test() {
    this.timeout(6000);

    await matterbridgeManager.installContainer(config);

    assert.calledWith(gladys.system.restartContainer, container.id);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MATTERBRIDGE.STATUS_CHANGE,
    });
    expect(matterbridgeManager.matterbridgeRunning).to.equal(true);
    expect(matterbridgeManager.matterbridgeExist).to.equal(true);
  });

  it('should failed when restart container failed', async function Test() {
    this.timeout(6000);
    gladys.system.restartContainer = fake.rejects('Error');

    try {
      await matterbridgeManager.installContainer();
      assert.fail();
    } catch (e) {
      expect(e.message).to.equal('Error');
    }

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MATTERBRIDGE.STATUS_CHANGE,
    });
    expect(matterbridgeManager.matterbridgeExist).to.equal(false);
    expect(matterbridgeManager.matterbridgeRunning).to.equal(false);
  });

  it('should do nothing', async () => {
    gladys.system.getContainers = fake.resolves([container]);

    await matterbridgeManager.installContainer(config);

    assert.notCalled(gladys.system.restartContainer);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MATTERBRIDGE.STATUS_CHANGE,
    });
    expect(matterbridgeManager.matterbridgeRunning).to.equal(true);
    expect(matterbridgeManager.matterbridgeExist).to.equal(true);
  });

  it('it should fail because not a Docker System', async () => {
    gladys.system.isDocker = fake.resolves(false);

    try {
      await matterbridgeManager.installContainer();
      assert.fail();
    } catch (e) {
      expect(e.message).to.equal('SYSTEM_NOT_RUNNING_DOCKER');
    }

    expect(matterbridgeManager.dockerBased).to.equal(false);
    expect(matterbridgeManager.matterbridgeRunning).to.equal(false);
    expect(matterbridgeManager.matterbridgeExist).to.equal(false);
  });

  it('it should fail because not a host network', async () => {
    gladys.system.getNetworkMode = fake.resolves('container');

    try {
      await matterbridgeManager.installContainer();
      assert.fail();
    } catch (e) {
      expect(e.message).to.equal('DOCKER_BAD_NETWORK');
    }

    expect(matterbridgeManager.networkModeValid).to.equal(false);
    expect(matterbridgeManager.matterbridgeRunning).to.equal(false);
    expect(matterbridgeManager.matterbridgeExist).to.equal(false);
  });

  it('should not create container if the service is not enabled', async () => {
    gladys.variable.getValue = fake.resolves('0');

    await matterbridgeManager.installContainer(config);

    assert.notCalled(gladys.system.pull);
    assert.notCalled(gladys.system.createContainer);
    assert.notCalled(gladys.system.restartContainer);

    expect(matterbridgeManager.matterbridgeRunning).to.equal(false);
    expect(matterbridgeManager.matterbridgeExist).to.equal(false);
  });
});
