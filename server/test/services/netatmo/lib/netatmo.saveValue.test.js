const { expect } = require('chai');
const sinon = require('sinon');
const EventEmitter = require('events');
const { updateValues } = require('../../../../services/netatmo/lib/netatmo.saveValue');
const { NetatmoHandlerMock } = require('../netatmo.mock.test');
const netatmoStatus = require('../../../../services/netatmo/lib/netatmo.status');
const { BadParameters } = require('../../../../utils/coreErrors');
const devicesGladys = require('../netatmo.convertDevices.mock.test.json');
const devicesNetatmo = require('../netatmo.loadDevices.mock.test.json');
const { EVENTS } = require('../../../../utils/constants');

describe('Netatmo Save configuration', () => {
  let eventEmitter;
  const deviceGladys = devicesGladys[0];
  const deviceNetatmo = devicesNetatmo[0];
  const externalId = `netatmo:${deviceNetatmo.id}`;
  beforeEach(() => {
    sinon.reset();

    NetatmoHandlerMock.saveStatus = sinon.stub().callsFake(netatmoStatus.saveStatus);
    NetatmoHandlerMock.status = 'not_initialized';
    eventEmitter = new EventEmitter();
    NetatmoHandlerMock.gladys = {
      event: eventEmitter,
      variable: {
        setValue: sinon.stub().resolves(),
      },
    };
    sinon.spy(NetatmoHandlerMock.gladys.event, 'emit');
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should update device values correctly for a plug device', async () => {
    await updateValues(NetatmoHandlerMock, deviceGladys, deviceNetatmo, externalId);

    expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(deviceGladys.features.length);
    sinon.assert.calledWith(NetatmoHandlerMock.gladys.event.emit, 'device.new-state', {
      device_feature_external_id: 'netatmo:70:ee:50:xx:xx:xx:rf_strength',
      state: 70,
    });
    expect(
      NetatmoHandlerMock.gladys.event.emit.getCall(0).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:70:ee:50:xx:xx:xx:rf_strength',
        state: 70,
      }),
    ).to.equal(true);
    expect(
      NetatmoHandlerMock.gladys.event.emit.getCall(1).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:70:ee:50:xx:xx:xx:wifi_strength',
        state: 45,
      }),
    ).to.equal(true);
    expect(
      NetatmoHandlerMock.gladys.event.emit.getCall(2).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:70:ee:50:xx:xx:xx:plug_connected_boiler',
        state: 0,
      }),
    ).to.equal(true);
  });

  it('should update device values correctly for a plug device no connected boiler', async () => {
    const deviceNetatmoPlug = JSON.parse(JSON.stringify(devicesNetatmo[0]));
    deviceNetatmoPlug.plug_connected_boiler = undefined;

    await updateValues(NetatmoHandlerMock, deviceGladys, deviceNetatmoPlug, externalId);

    expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(deviceGladys.features.length);
    sinon.assert.calledWith(NetatmoHandlerMock.gladys.event.emit, 'device.new-state', {
      device_feature_external_id: 'netatmo:70:ee:50:xx:xx:xx:rf_strength',
      state: 70,
    });
    expect(
      NetatmoHandlerMock.gladys.event.emit.getCall(0).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:70:ee:50:xx:xx:xx:rf_strength',
        state: 70,
      }),
    ).to.equal(true);
    expect(
      NetatmoHandlerMock.gladys.event.emit.getCall(1).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:70:ee:50:xx:xx:xx:wifi_strength',
        state: 45,
      }),
    ).to.equal(true);
    expect(
      NetatmoHandlerMock.gladys.event.emit.getCall(2).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:70:ee:50:xx:xx:xx:plug_connected_boiler',
        state: 0,
      }),
    ).to.equal(true);
  });

  it('should not update values if feature not found', async () => {
    const deviceGladysFake = JSON.parse(JSON.stringify(deviceGladys));
    deviceGladysFake.features = [];
    await updateValues(NetatmoHandlerMock, deviceGladysFake, deviceNetatmo, externalId);

    sinon.assert.notCalled(NetatmoHandlerMock.gladys.event.emit);
  });

  it('should handle invalid external_id format on prefix', async () => {
    const externalIdFake = deviceGladys.external_id.replace('netatmo:', '');

    try {
      await updateValues(NetatmoHandlerMock, deviceGladys, deviceNetatmo, externalIdFake);
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
      expect(e.message).to.equal(
        `Netatmo device external_id is invalid: "${externalIdFake}" should starts with "netatmo:"`,
      );
    }
  });

  it('should handle invalid external_id format on topic', async () => {
    const externalIdFake = 'netatmo:';

    try {
      await updateValues(NetatmoHandlerMock, deviceGladys, deviceNetatmo, externalIdFake);
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
      expect(e.message).to.equal(
        `Netatmo device external_id is invalid: "${externalIdFake}" have no id and category indicator`,
      );
    }
  });

  it('should save all values according to all cases', async () => {
    const deviceGladysThermostat = JSON.parse(JSON.stringify(devicesGladys[1]));
    deviceGladysThermostat.features.push({
      name: 'Setpoint Fake temperature - Thermostat Test',
      external_id: 'netatmo:04:00:00:xx:xx:xx:setpoint_temp',
      selector: 'netatmo:04:00:00:xx:xx:xx:setpoint_temp',
      category: 'thermostat',
      type: 'target-temperature',
      unit: 'celsius',
      read_only: false,
      keep_history: true,
      has_feedback: false,
      min: 5,
      max: 30,
    });
    const deviceNetatmoThermostat = devicesNetatmo[1];

    await updateValues(NetatmoHandlerMock, deviceGladysThermostat, deviceNetatmoThermostat, externalId);

    expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(7 + 1);
    sinon.assert.calledWith(NetatmoHandlerMock.gladys.event.emit, 'device.new-state', {
      device_feature_external_id: `${deviceGladysThermostat.external_id}:battery_percent`,
      state: 60,
    });
    expect(
      NetatmoHandlerMock.gladys.event.emit.getCall(0).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:04:00:00:xx:xx:xx:battery_percent',
        state: 60,
      }),
    ).to.equal(true);
    expect(
      NetatmoHandlerMock.gladys.event.emit.getCall(1).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:04:00:00:xx:xx:xx:temperature',
        state: 19.6,
      }),
    ).to.equal(true);
    expect(
      NetatmoHandlerMock.gladys.event.emit.getCall(2).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:04:00:00:xx:xx:xx:therm_measured_temperature',
        state: 19.4,
      }),
    ).to.equal(true);
    expect(
      NetatmoHandlerMock.gladys.event.emit.getCall(3).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:04:00:00:xx:xx:xx:therm_setpoint_temperature',
        state: 19.5,
      }),
    ).to.equal(true);
    expect(
      NetatmoHandlerMock.gladys.event.emit.getCall(4).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:04:00:00:xx:xx:xx:open_window',
        state: 0,
      }),
    ).to.equal(true);
    expect(
      NetatmoHandlerMock.gladys.event.emit.getCall(5).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:04:00:00:xx:xx:xx:rf_strength',
        state: 60,
      }),
    ).to.equal(true);
    expect(
      NetatmoHandlerMock.gladys.event.emit.getCall(6).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:04:00:00:xx:xx:xx:boiler_status',
        state: 1,
      }),
    ).to.equal(true);
    expect(
      NetatmoHandlerMock.gladys.event.emit.getCall(7).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:04:00:00:xx:xx:xx:setpoint_temp',
        state: 14,
      }),
    ).to.equal(true);
  });

  it('should handle the case where the feature value is never set at the root', async () => {
    const deviceNetatmoThermostat = JSON.parse(JSON.stringify(devicesNetatmo[1]));
    deviceNetatmoThermostat.battery_percent = undefined;

    await updateValues(NetatmoHandlerMock, devicesGladys[1], deviceNetatmoThermostat, externalId);

    expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(7 - 1);
    sinon.assert.neverCalledWith(
      NetatmoHandlerMock.gladys.event.emit,
      'device.new-state',
      sinon.match.has('device_feature_external_id', `${devicesGladys[1].external_id}:battery_percent`),
    );
    expect(
      NetatmoHandlerMock.gladys.event.emit.getCall(0).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:04:00:00:xx:xx:xx:temperature',
        state: 19.6,
      }),
    ).to.equal(true);
  });

  it('should handle case when feature value is NaN', async () => {
    const deviceGladysThermostat = JSON.parse(JSON.stringify(devicesGladys[1]));
    deviceGladysThermostat.features.forEach((deviceFeature) => {
      deviceFeature.last_value = 0;
    });
    const deviceNetatmoThermostat = JSON.parse(JSON.stringify(devicesNetatmo[1]));
    deviceNetatmoThermostat.battery_percent = null;

    await updateValues(NetatmoHandlerMock, deviceGladysThermostat, deviceNetatmoThermostat, externalId);

    expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(7 - 1 - 1);
    sinon.assert.neverCalledWith(NetatmoHandlerMock.gladys.event.emit, 'device.new-state', {
      device_feature_external_id: `${deviceGladysThermostat.external_id}:battery_percent`,
      state: undefined,
    });
    sinon.assert.neverCalledWith(NetatmoHandlerMock.gladys.event.emit, 'device.new-state', {
      device_feature_external_id: `${deviceGladysThermostat.external_id}:open_window`,
      state: undefined,
    });
    expect(
      NetatmoHandlerMock.gladys.event.emit.getCall(0).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:04:00:00:xx:xx:xx:temperature',
        state: 19.6,
      }),
    ).to.equal(true);
    expect(
      NetatmoHandlerMock.gladys.event.emit.getCall(4).calledWith(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'netatmo:04:00:00:xx:xx:xx:boiler_status',
        state: 1,
      }),
    ).to.equal(true);
  });
});
