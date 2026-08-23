const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

const load = () =>
  proxyquire('../../../../services/thermostat/lib/thermostat.setVariable', {
    '../../../utils/logger': {
      debug: fake.returns(null),
      info: fake.returns(null),
      warn: fake.returns(null),
    },
  });

const buildHandler = () => {
  const { setVariable, getVariable, broadcastConfigUpdated, triggerApplySchedules } = load();
  const handler = {
    gladys: {
      variable: { setValue: fake.resolves({ value: 'saved' }), getValue: fake.resolves('comfort') },
      event: { emit: fake.returns(null) },
    },
    serviceId: 'service-id',
    applySchedules: fake.resolves(null),
    setVariable,
    getVariable,
    broadcastConfigUpdated,
    triggerApplySchedules,
  };
  return handler;
};

describe('thermostat.setVariable', () => {
  it('should reject a key outside the THERMOSTAT_ namespace', async () => {
    const handler = buildHandler();

    let error = null;
    try {
      await handler.setVariable('SOME_OTHER_VARIABLE', 'x');
    } catch (e) {
      error = e;
    }

    expect(error).to.not.equal(null);
    expect(error.message).to.contain('Invalid thermostat variable key');
    assert.notCalled(handler.gladys.variable.setValue);
  });

  it('should persist the variable', async () => {
    const handler = buildHandler();

    await handler.setVariable('THERMOSTAT_LIVING_ROOM_PRESET', 'eco');

    assert.calledWith(handler.gladys.variable.setValue, 'THERMOSTAT_LIVING_ROOM_PRESET', 'eco', 'service-id');
  });

  it('should refuse a configuration key: the config lives on the device', async () => {
    const handler = buildHandler();

    let error = null;
    try {
      await handler.setVariable('THERMOSTAT_CONFIG_LIVING_ROOM', '{}');
    } catch (e) {
      error = e;
    }

    expect(error).to.not.equal(null);
    assert.notCalled(handler.gladys.variable.setValue);
  });

  it('should broadcast PRESET_UPDATED for a preset variable', async () => {
    const handler = buildHandler();

    await handler.setVariable('THERMOSTAT_LIVING_ROOM_PRESET', 'night');

    const [, message] = handler.gladys.event.emit.firstCall.args;
    expect(message.type).to.equal(WEBSOCKET_MESSAGE_TYPES.THERMOSTAT.PRESET_UPDATED);
  });

  it('should broadcast MANUAL_MODE_UPDATED for a manual mode variable', async () => {
    const handler = buildHandler();

    await handler.setVariable('THERMOSTAT_LIVING_ROOM_MANUAL_MODE', 'true');

    const [, message] = handler.gladys.event.emit.firstCall.args;
    expect(message.type).to.equal(WEBSOCKET_MESSAGE_TYPES.THERMOSTAT.MANUAL_MODE_UPDATED);
  });

  it('should not broadcast anything for an unrelated thermostat variable', async () => {
    const handler = buildHandler();

    await handler.setVariable('THERMOSTAT_LIVING_ROOM_MANUAL_UNTIL', '123');

    assert.notCalled(handler.gladys.event.emit);
    assert.calledOnce(handler.gladys.variable.setValue);
  });
});

describe('thermostat.broadcastConfigUpdated', () => {
  it('should tell the dashboards to reload, without carrying the config itself', async () => {
    const handler = buildHandler();

    handler.broadcastConfigUpdated();

    // An empty payload on purpose: the device is the single store, so a copy
    // travelling here could disagree with what the regulation loop reads.
    assert.calledWith(handler.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.THERMOSTAT.CONFIG_UPDATED,
      payload: {},
    });
  });
});

describe('thermostat.getVariable', () => {
  it('should read a runtime variable in this service scope', async () => {
    const handler = buildHandler();

    const value = await handler.getVariable('THERMOSTAT_LIVING_ROOM_PRESET');

    expect(value).to.equal('comfort');
    assert.calledWith(handler.gladys.variable.getValue, 'THERMOSTAT_LIVING_ROOM_PRESET', 'service-id');
  });

  it('should return null for a key outside the runtime namespace', async () => {
    const handler = buildHandler();

    expect(await handler.getVariable('THERMOSTAT_CONFIG_LIVING_ROOM')).to.equal(null);
    assert.notCalled(handler.gladys.variable.getValue);
  });
});

describe('thermostat.triggerApplySchedules', () => {
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });

  it('should run applySchedules once after the debounce delay', async () => {
    const handler = buildHandler();

    handler.triggerApplySchedules();
    assert.notCalled(handler.applySchedules);

    await clock.tickAsync(2000);
    assert.calledOnce(handler.applySchedules);
  });

  it('should collapse a burst of calls into a single run', async () => {
    const handler = buildHandler();

    handler.triggerApplySchedules();
    await clock.tickAsync(500);
    handler.triggerApplySchedules();
    await clock.tickAsync(500);
    handler.triggerApplySchedules();

    await clock.tickAsync(2000);
    assert.calledOnce(handler.applySchedules);
  });

  it('should swallow an applySchedules failure', async () => {
    const handler = buildHandler();
    handler.applySchedules = fake.rejects(new Error('boom'));

    handler.triggerApplySchedules();
    await clock.tickAsync(2000);

    assert.calledOnce(handler.applySchedules);
  });
});
