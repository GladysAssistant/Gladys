const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const NodeRedManager = require('../../../../services/node-red/lib');

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

describe('NodeRed installContainer', () => {
  const TEMP_GLADYS_FOLDER = process.env.TEMP_FOLDER || '../.tmp';
  // PREPARE
  let nodeRedManager;
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
    };

    nodeRedManager = new NodeRedManager(gladys, serviceId);
    nodeRedManager.nodeRedRunning = false;
    nodeRedManager.nodeRedExist = false;
    nodeRedManager.containerRestartWaitTimeInMs = 0;
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should restart container', async function Test() {
    this.timeout(6000);

    await nodeRedManager.installContainer(config);

    assert.calledWith(gladys.system.restartContainer, container.id);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NODERED.STATUS_CHANGE,
    });
    expect(nodeRedManager.nodeRedRunning).to.equal(true);
    expect(nodeRedManager.nodeRedExist).to.equal(true);
  });

  it('should do nothing', async () => {
    gladys.system.getContainers = fake.resolves([container]);

    await nodeRedManager.installContainer(config);

    assert.notCalled(gladys.system.restartContainer);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NODERED.STATUS_CHANGE,
    });
    expect(nodeRedManager.nodeRedRunning).to.equal(true);
    expect(nodeRedManager.nodeRedExist).to.equal(true);
  });

  it('it should fail because not a Docker System', async () => {
    gladys.system.isDocker = fake.resolves(false);

    try {
      await nodeRedManager.installContainer();
      assert.fail();
    } catch (e) {
      expect(e.message).to.equal('SYSTEM_NOT_RUNNING_DOCKER');
    }

    expect(nodeRedManager.dockerBased).to.equal(false);
    expect(nodeRedManager.nodeRedRunning).to.equal(false);
    expect(nodeRedManager.nodeRedExist).to.equal(false);
  });

  it('it should fail because not a host network', async () => {
    gladys.system.getNetworkMode = fake.resolves('container');

    try {
      await nodeRedManager.installContainer();
      assert.fail();
    } catch (e) {
      expect(e.message).to.equal('DOCKER_BAD_NETWORK');
    }

    expect(nodeRedManager.networkModeValid).to.equal(false);
    expect(nodeRedManager.nodeRedRunning).to.equal(false);
    expect(nodeRedManager.nodeRedExist).to.equal(false);
  });
});
