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
  beforeEach(() => {
    sinon.reset();

    netatmoHandler.status = 'not_initialized';
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should not update values if type not supported', async () => {
    const deviceGladys = { ...JSON.parse(JSON.stringify(devicesGladys[devicesGladys.length - 1])) };
    const deviceNetatmo = { ...JSON.parse(JSON.stringify(devicesNetatmo[devicesNetatmo.length - 1])) };
    const externalId = `netatmo:${deviceNetatmo.id}`;

    await netatmoHandler.updateValues(deviceGladys, deviceNetatmo, externalId);

    sinon.assert.notCalled(netatmoHandler.gladys.event.emit);
  });

  it('should not update values if feature not found', async () => {
    const deviceGladys = { ...JSON.parse(JSON.stringify(devicesGladys[0])) };
    const deviceNetatmo = { ...JSON.parse(JSON.stringify(devicesNetatmo[0])) };
    const externalId = `netatmo:${deviceNetatmo.id}`;
    deviceGladys.features = [];

    await netatmoHandler.updateValues(deviceGladys, deviceNetatmo, externalId);

    sinon.assert.notCalled(netatmoHandler.gladys.event.emit);
  });

  it('should handle invalid external_id format on prefix', async () => {
    const deviceGladys = { ...JSON.parse(JSON.stringify(devicesGladys[0])) };
    const deviceNetatmo = { ...JSON.parse(JSON.stringify(devicesNetatmo[0])) };
    const externalIdFake = deviceGladys.external_id.replace('netatmo:', '');

    try {
      await netatmoHandler.updateValues(deviceGladys, deviceNetatmo, externalIdFake);
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
      expect(e.message).to.equal(
        `Netatmo device external_id is invalid: "${externalIdFake}" should starts with "netatmo:"`,
      );
    }
  });

  it('should handle invalid external_id format on topic', async () => {
    const deviceGladys = { ...JSON.parse(JSON.stringify(devicesGladys[0])) };
    const deviceNetatmo = { ...JSON.parse(JSON.stringify(devicesNetatmo[0])) };
    const externalIdFake = 'netatmo:';

    try {
      await netatmoHandler.updateValues(deviceGladys, deviceNetatmo, externalIdFake);
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
      expect(e.message).to.equal(
        `Netatmo device external_id is invalid: "${externalIdFake}" have no id and category indicator`,
      );
    }
  });

  it('should update device values for a plug device', async () => {
    const deviceGladys = { ...JSON.parse(JSON.stringify(devicesGladys[0])) };
    const deviceNetatmo = { ...JSON.parse(JSON.stringify(devicesNetatmo[0])) };
    const externalId = `netatmo:${deviceNetatmo.id}`;

    await netatmoHandler.updateValues(deviceGladys, deviceNetatmo, externalId);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(deviceGladys.features.length);
  });

  it('should save all values thermostat according to all cases', async () => {
    const deviceGladys = { ...JSON.parse(JSON.stringify(devicesGladys[1])) };
    const deviceNetatmo = { ...JSON.parse(JSON.stringify(devicesNetatmo[1])) };
    const externalId = `netatmo:${deviceNetatmo.id}`;

    await netatmoHandler.updateValues(deviceGladys, deviceNetatmo, externalId);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(7);
  });

  it('should save all values valves according to all cases', async () => {
    const deviceGladys = { ...JSON.parse(JSON.stringify(devicesGladys[3])) };
    const deviceNetatmo = { ...JSON.parse(JSON.stringify(devicesNetatmo[3])) };
    const externalId = `netatmo:${deviceNetatmo.id}`;

    await netatmoHandler.updateValues(deviceGladys, deviceNetatmo, externalId);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(6);
  });

  it('should save all values weather station according to all cases', async () => {
    const deviceGladys = { ...JSON.parse(JSON.stringify(devicesGladys[4])) };
    const deviceNetatmo = { ...JSON.parse(JSON.stringify(devicesNetatmo[4])) };
    const externalId = `netatmo:${deviceNetatmo.id}`;

    await netatmoHandler.updateValues(deviceGladys, deviceNetatmo, externalId);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(10);
  });

  it('should save all values module outdoor according to all cases', async () => {
    const deviceGladys = { ...JSON.parse(JSON.stringify(devicesGladys[5])) };
    const deviceNetatmo = { ...JSON.parse(JSON.stringify(devicesNetatmo[5])) };
    const externalId = `netatmo:${deviceNetatmo.id}`;

    await netatmoHandler.updateValues(deviceGladys, deviceNetatmo, externalId);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(6);
  });

  it('should save all values module anemometer according to all cases', async () => {
    const deviceGladys = { ...JSON.parse(JSON.stringify(devicesGladys[6])) };
    const deviceNetatmo = { ...JSON.parse(JSON.stringify(devicesNetatmo[6])) };
    const externalId = `netatmo:${deviceNetatmo.id}`;

    await netatmoHandler.updateValues(deviceGladys, deviceNetatmo, externalId);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(8);
  });

  it('should save all values module rain gauge according to all cases', async () => {
    const deviceGladys = { ...JSON.parse(JSON.stringify(devicesGladys[7])) };
    const deviceNetatmo = { ...JSON.parse(JSON.stringify(devicesNetatmo[7])) };
    const externalId = `netatmo:${deviceNetatmo.id}`;

    await netatmoHandler.updateValues(deviceGladys, deviceNetatmo, externalId);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(5);
  });

  it('should save all values module indoor according to all cases', async () => {
    const deviceGladys = { ...JSON.parse(JSON.stringify(devicesGladys[8])) };
    const deviceNetatmo = { ...JSON.parse(JSON.stringify(devicesNetatmo[8])) };
    const externalId = `netatmo:${deviceNetatmo.id}`;

    await netatmoHandler.updateValues(deviceGladys, deviceNetatmo, externalId);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(8);
  });
});
