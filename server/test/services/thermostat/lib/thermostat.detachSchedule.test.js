const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;

const load = () =>
  proxyquire('../../../../services/thermostat/lib/thermostat.detachSchedule', {
    '../../../utils/logger': {
      debug: fake.returns(null),
      info: fake.returns(null),
      warn: fake.returns(null),
    },
  });

const deviceFollowing = (selector, scheduleSelector) => ({
  selector,
  params: [{ name: 'THERMOSTAT_ACTIVE_SCHEDULE', value: scheduleSelector }],
});

const buildHandler = (devices, { destroyParam = fake.resolves(null) } = {}) => {
  const { detachSchedule } = load();
  return {
    gladys: {
      device: { get: fake.resolves(devices), destroyParam },
    },
    broadcastConfigUpdated: fake.returns(null),
    detachSchedule,
  };
};

describe('thermostat.detachSchedule', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should drop the active schedule param of every thermostat following it', async () => {
    const first = deviceFollowing('thermostat-living-room', 'week');
    const second = deviceFollowing('thermostat-bedroom', 'week');
    const handler = buildHandler([first, second]);

    const detached = await handler.detachSchedule('week');

    expect(detached).to.equal(2);
    assert.calledWith(handler.gladys.device.destroyParam, first, 'THERMOSTAT_ACTIVE_SCHEDULE');
    assert.calledWith(handler.gladys.device.destroyParam, second, 'THERMOSTAT_ACTIVE_SCHEDULE');
  });

  it('should leave the thermostats following another schedule alone', async () => {
    const other = deviceFollowing('thermostat-bedroom', 'weekend');
    const handler = buildHandler([deviceFollowing('thermostat-living-room', 'week'), other]);

    const detached = await handler.detachSchedule('week');

    expect(detached).to.equal(1);
    expect(handler.gladys.device.destroyParam.calledWith(other)).to.equal(false);
  });

  it('should not broadcast when no thermostat followed the schedule', async () => {
    const handler = buildHandler([deviceFollowing('thermostat-bedroom', 'weekend')]);

    const detached = await handler.detachSchedule('week');

    expect(detached).to.equal(0);
    assert.notCalled(handler.gladys.device.destroyParam);
    assert.notCalled(handler.broadcastConfigUpdated);
  });

  it('should tell the open dashboards to reload once a thermostat was detached', async () => {
    const handler = buildHandler([deviceFollowing('thermostat-living-room', 'week')]);

    await handler.detachSchedule('week');

    assert.calledOnce(handler.broadcastConfigUpdated);
  });

  it('should keep detaching the others when one param cannot be removed', async () => {
    // The schedule is deleted right after: one device left with a stale param is
    // better than aborting halfway and leaving the rest pointing at it too.
    const failing = deviceFollowing('thermostat-living-room', 'week');
    const handler = buildHandler([failing, deviceFollowing('thermostat-bedroom', 'week')], {
      destroyParam: fake(async (device) => {
        if (device === failing) {
          throw new Error('database is locked');
        }
        return null;
      }),
    });

    const detached = await handler.detachSchedule('week');

    expect(detached).to.equal(2);
    expect(handler.gladys.device.destroyParam.callCount).to.equal(2);
  });

  it('should handle a device with no params at all', async () => {
    const handler = buildHandler([{ selector: 'thermostat-living-room' }]);

    const detached = await handler.detachSchedule('week');

    expect(detached).to.equal(0);
  });

  it('should handle the absence of any thermostat device', async () => {
    const handler = buildHandler(null);

    const detached = await handler.detachSchedule('week');

    expect(detached).to.equal(0);
  });
});
