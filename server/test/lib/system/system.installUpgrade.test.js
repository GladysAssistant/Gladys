const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const proxyquire = require('proxyquire').noCallThru();

const { PlatformNotCompatible } = require('../../../utils/coreErrors');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES, SYSTEM_UPGRADE_ERROR_CODES } = require('../../../utils/constants');
const DockerodeMock = require('./DockerodeMock.test');

const System = proxyquire('../../../lib/system', {
  dockerode: DockerodeMock,
});
const Job = require('../../../lib/job');

const sequelize = {
  close: fake.resolves(null),
};

const event = {
  on: fake.resolves(null),
  emit: fake.returns(null),
};

const job = new Job(event);

const config = {
  tempFolder: '/tmp/gladys',
};

// the Dockerode mock is shared by every system test file: patch it through a
// dedicated sandbox so restoring it never touches the other suites
const sandbox = sinon.createSandbox();

const getUpgradeErrors = () =>
  event.emit
    .getCalls()
    .filter(
      (call) =>
        call.args[0] === EVENTS.WEBSOCKET.SEND_ALL &&
        call.args[1].type === WEBSOCKET_MESSAGE_TYPES.SYSTEM.UPGRADE_ERROR,
    )
    .map((call) => call.args[1].payload);

describe('system.installUpgrade', () => {
  let system;

  beforeEach(async () => {
    system = new System(sequelize, event, config, job);
    await system.init();
    system.getGladysContainerId = fake.resolves('fb8251117cc4');
    // Reset all fakes invoked within init call
    sinon.reset();
    // the Dockerode mock fakes live outside the default sandbox, sinon.reset()
    // does not clear the calls they recorded during the previous test
    event.emit.resetHistory();
    system.dockerode.createContainer.resetHistory();
  });

  afterEach(() => {
    sandbox.restore();
    sinon.reset();
  });

  it('should fail: not run inside docker', async () => {
    system.dockerode = undefined;

    try {
      await system.installUpgrade();
      assert.fail('should have fail');
    } catch (e) {
      expect(e).be.instanceOf(PlatformNotCompatible);
      expect(e).to.have.property('message', 'SYSTEM_NOT_RUNNING_DOCKER');

      assert.notCalled(sequelize.close);
      assert.notCalled(event.on);
    }
  });

  it('should install upgrade', async () => {
    await system.installUpgrade();
    assert.called(system.dockerode.createContainer);
    expect(getUpgradeErrors()).to.deep.equal([]);
  });

  it('should only upgrade the Gladys container', async () => {
    await system.installUpgrade();

    const { Cmd } = system.dockerode.createContainer.firstCall.args[0];
    expect(Cmd).to.deep.equal(['--run-once', '--cleanup', '--include-restarting', 'gladys']);
  });

  it('should not run Watchtower when the image is pinned', async () => {
    system.getGladysImage = fake.resolves({
      container_name: 'gladys',
      image: 'gladysassistant/gladys:v4.83.0',
      tag: 'v4.83.0',
      pinned: true,
      recommended_image: 'gladysassistant/gladys:v4',
    });

    await system.installUpgrade();

    assert.notCalled(system.dockerode.createContainer);
    expect(getUpgradeErrors()).to.deep.equal([
      {
        code: SYSTEM_UPGRADE_ERROR_CODES.IMAGE_TAG_PINNED,
        image: 'gladysassistant/gladys:v4.83.0',
        recommended_image: 'gladysassistant/gladys:v4',
      },
    ]);
  });

  it('should report an error when the Gladys container is not found', async () => {
    system.getGladysImage = fake.rejects(new PlatformNotCompatible('DOCKER_CONTAINER_ID_NOT_AVAILABLE'));

    await system.installUpgrade();

    assert.notCalled(system.dockerode.createContainer);
    expect(getUpgradeErrors()).to.deep.equal([{ code: SYSTEM_UPGRADE_ERROR_CODES.GLADYS_CONTAINER_NOT_FOUND }]);
  });

  it('should report an error when Watchtower exits with a non-zero status code', async () => {
    const container = await system.dockerode.createContainer({});
    sandbox.replace(container, 'wait', fake.resolves({ StatusCode: 1 }));

    await system.installUpgrade();

    expect(getUpgradeErrors()).to.deep.equal([{ code: SYSTEM_UPGRADE_ERROR_CODES.WATCHTOWER_FAILED, status_code: 1 }]);
  });

  it('should report an error when Watchtower found nothing to update', async () => {
    const container = await system.dockerode.createContainer({});
    // the Watchtower run reports no new image at all
    sandbox.replace(container, 'logs', () => ({
      on: (streamEvent, callback) => {
        if (streamEvent === 'data') {
          callback('mtime="2025-03-31T14:24:23Z" level=info msg="Session done"');
        }
      },
    }));

    await system.installUpgrade();

    expect(getUpgradeErrors()).to.deep.equal([
      { code: SYSTEM_UPGRADE_ERROR_CODES.NO_UPDATE_APPLIED, image: 'gladysassistant/gladys:v4' },
    ]);
  });
});
