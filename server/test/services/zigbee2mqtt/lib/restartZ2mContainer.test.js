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
    expect(zigbee2mqttManager.zigbee2mqttStartingSince).to.equal(new Date('2026-11-17T08:00:00.000Z').getTime());
    // Read from the second the restart was asked
    assert.calledOnceWithExactly(
      zigbee2mqttManager.readZ2mContainerLogs,
      'z2m-container',
      Math.floor(new Date('2026-11-17T08:00:00.000Z').getTime() / 1000),
    );
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
