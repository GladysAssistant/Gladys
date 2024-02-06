const { expect } = require('chai');
const sinon = require('sinon');

const { fake } = sinon;

const devicesGladys = require('../netatmo.convertDevices.mock.test.json');
const devicesNetatmo = require('../netatmo.loadDevices.mock.test.json');
const { BadParameters } = require('../../../../utils/coreErrors');
const NetatmoHandler = require('../../../../services/netatmo/lib/index');

const gladys = {
  event: {
    emit: fake.resolves(null),
  },
  variable: {
    setValue: fake.resolves(null),
  },
};
const serviceId = 'serviceId';

const netatmoHandler = new NetatmoHandler(gladys, serviceId);

describe('Netatmo update features type', () => {
  const deviceGladysNAPlug = JSON.parse(JSON.stringify(devicesGladys[0]));
  const deviceGladysNATherm1 = JSON.parse(JSON.stringify(devicesGladys[1]));
  const deviceGladysNotSupported = devicesGladys[devicesGladys.length - 1];
  const deviceNetatmoNAPlug = devicesNetatmo[0];
  const deviceNetatmoNATherm1 = devicesNetatmo[1];
  const deviceNetatmoNotSupported = devicesNetatmo[devicesGladys.length - 1];
  const externalIdNAPlug = `netatmo:${deviceNetatmoNAPlug.id}`;
  const externalIdNATherm1 = `netatmo:${deviceNetatmoNATherm1.id}`;
  const externalIdNotSupported = `netatmo:${deviceNetatmoNotSupported.id}`;
  beforeEach(() => {
    sinon.reset();

    netatmoHandler.status = 'not_initialized';
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should not update values if type not supported', async () => {
    deviceGladysNAPlug.features = [];
    await netatmoHandler.updateValues(deviceGladysNotSupported, deviceNetatmoNotSupported, externalIdNotSupported);

    sinon.assert.notCalled(netatmoHandler.gladys.event.emit);
  });

  it('should not update values if feature not found', async () => {
    deviceGladysNAPlug.features = [];
    await netatmoHandler.updateValues(deviceGladysNAPlug, deviceNetatmoNAPlug, externalIdNAPlug);

    sinon.assert.notCalled(netatmoHandler.gladys.event.emit);
  });

  it('should handle invalid external_id format on prefix', async () => {
    const externalIdFake = deviceGladysNAPlug.external_id.replace('netatmo:', '');

    try {
      await netatmoHandler.updateValues(deviceGladysNAPlug, deviceNetatmoNAPlug, externalIdFake);
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
      await netatmoHandler.updateValues(deviceGladysNAPlug, deviceNetatmoNAPlug, externalIdFake);
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
      expect(e.message).to.equal(
        `Netatmo device external_id is invalid: "${externalIdFake}" have no id and category indicator`,
      );
    }
  });

  it('should update device values for a plug device', async () => {
    await netatmoHandler.updateValues(deviceGladysNAPlug, deviceNetatmoNAPlug, externalIdNAPlug);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(deviceGladysNAPlug.features.length);
  });

  it('should save all values according to all cases', async () => {
    await netatmoHandler.updateValues(deviceGladysNATherm1, deviceNetatmoNATherm1, externalIdNATherm1);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(7);
  });
});
