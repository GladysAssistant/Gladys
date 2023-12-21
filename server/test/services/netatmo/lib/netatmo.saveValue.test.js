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

  it('should not update values if feature not found', async () => {
    const deviceGladysFake = JSON.parse(JSON.stringify(deviceGladys));
    deviceGladysFake.features = [];
    await updateValues(NetatmoHandlerMock, deviceGladysFake, deviceNetatmo, externalId);

    sinon.assert.notCalled(NetatmoHandlerMock.gladys.event.emit);
  });

  it('should handle invalid external_id format', async () => {
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
});
