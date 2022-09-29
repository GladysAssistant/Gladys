const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const proxyquire = require('proxyquire').noCallThru();

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { PlatformNotCompatible } = require('../../../utils/coreErrors');
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
  emit: fake.resolves(null),
};

const job = new Job(event);

const config = {
  tempFolder: '/tmp/gladys',
};

describe('system.downloadUpgrade', () => {
  let system;

  beforeEach(async () => {
    system = new System(sequelize, event, config, job);
    await system.init();
    // Reset all fakes invoked within init call
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should failed as not on docker env', async () => {
    system.dockerode = undefined;

    try {
      await system.downloadUpgrade('latest');
      assert.fail('should have fail');
    } catch (e) {
      expect(e).be.instanceOf(PlatformNotCompatible);

      assert.notCalled(sequelize.close);
      assert.notCalled(event.on);
      assert.notCalled(event.emit);
    }
  });

  it('should download upgrade', async () => {
    const tag = 'latest';
    await system.downloadUpgrade(tag);

    assert.notCalled(sequelize.close);
    assert.notCalled(event.on);

    assert.calledTwice(event.emit);
    assert.calledWith(event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.UPGRADE.DOWNLOAD_PROGRESS,
      payload: { event: {} },
    });
    assert.calledWith(event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.UPGRADE.DOWNLOAD_FINISHED,
      payload: {},
    });
  });

  it('should fail downloading upgrade', async () => {
    const tag = 'fail';
    await system.downloadUpgrade(tag);

    assert.notCalled(sequelize.close);
    assert.notCalled(event.on);

    assert.calledOnce(event.emit);
    assert.calledWith(event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.UPGRADE.DOWNLOAD_FAILED,
      payload: {},
    });
  });
});
