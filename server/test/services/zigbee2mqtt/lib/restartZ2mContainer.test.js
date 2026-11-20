const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt restartZ2mContainer', () => {
  let zigbee2mqttManager;
  let gladys;
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers(new Date('2026-11-17T08:00:00.000Z'));
    gladys = {
      job: {
        wrapper: (type, func) => async () => func(),
      },
      event: {
        emit: fake(),
      },
      system: {
        restartContainer: fake.resolves(null),
      },
    };
    zigbee2mqttManager = new Zigbee2mqttManager(gladys, null, serviceId);
    zigbee2mqttManager.readZ2mContainerLogs = fake.resolves(null);
  });

  afterEach(() => {
    clock.restore();
    sinon.restore();
  });

  it('should restart the container, tell that it starts and read the logs of the new run', async () => {
    // EXECUTE
    await zigbee2mqttManager.restartZ2mContainer('z2m-container');
    // ASSERT
    assert.calledOnceWithExactly(gladys.system.restartContainer, 'z2m-container');
    expect(zigbee2mqttManager.zigbee2mqttStarting).to.equal(true);
    // A new run: the reader of the previous one tells nothing any more
    expect(zigbee2mqttManager.z2mRun).to.equal(1);
    expect(zigbee2mqttManager.zigbee2mqttStartingSince).to.equal(new Date('2026-11-17T08:00:00.000Z').getTime());
    // Read from the second the restart was asked
    assert.calledOnceWithExactly(
      zigbee2mqttManager.readZ2mContainerLogs,
      'z2m-container',
      Math.floor(new Date('2026-11-17T08:00:00.000Z').getTime() / 1000),
    );
  });

  it('should count the new run before Docker stops the previous one, whose reader ends meanwhile', async () => {
    // PREPARE
    let runWhileRestarting = null;
    gladys.system.restartContainer = fake(() => {
      runWhileRestarting = zigbee2mqttManager.z2mRun;
      return Promise.resolve(null);
    });
    // EXECUTE
    await zigbee2mqttManager.restartZ2mContainer('z2m-container');
    // ASSERT
    expect(runWhileRestarting).to.equal(1);
  });

  it('should not tell that it starts when Docker refuses the restart', async () => {
    // PREPARE
    gladys.system.restartContainer = fake.rejects(new Error('error gathering device information'));
    // EXECUTE
    await expect(zigbee2mqttManager.restartZ2mContainer('z2m-container')).to.be.rejectedWith(
      'error gathering device information',
    );
    // ASSERT
    expect(zigbee2mqttManager.zigbee2mqttStarting).to.equal(false);
    expect(zigbee2mqttManager.startingTimer).to.equal(null);
    assert.notCalled(zigbee2mqttManager.readZ2mContainerLogs);
  });

  it('should stop telling that it starts once the window is over', async () => {
    // PREPARE
    await zigbee2mqttManager.restartZ2mContainer('z2m-container');
    // EXECUTE
    clock.tick(zigbee2mqttManager.zigbee2mqttStartingTimeoutInMs);
    // ASSERT
    expect(zigbee2mqttManager.zigbee2mqttStarting).to.equal(false);
    expect(zigbee2mqttManager.startingTimer).to.equal(null);
    assert.calledWithMatch(gladys.event.emit, 'websocket.send-all', { payload: { zigbee2mqttStarting: false } });
  });

  it('should open a new window on each restart', async () => {
    // PREPARE
    await zigbee2mqttManager.restartZ2mContainer('z2m-container');
    clock.tick(zigbee2mqttManager.zigbee2mqttStartingTimeoutInMs - 1000);
    // EXECUTE
    await zigbee2mqttManager.restartZ2mContainer('z2m-container');
    clock.tick(2000);
    // ASSERT
    expect(zigbee2mqttManager.zigbee2mqttStarting).to.equal(true);
  });
});
