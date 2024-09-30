const { expect } = require('chai');
const sinon = require('sinon');
const nock = require('nock');

const { fake } = sinon;

const devicesGladys = require('../netatmo.convertDevices.mock.test.json');
const devicesNetatmo = require('../netatmo.loadDevices.mock.test.json');
const { BadParameters } = require('../../../../utils/coreErrors');
const { FfmpegMock, childProcessMock } = require('../FfmpegMock.test');
const NetatmoHandler = require('../../../../services/netatmo/lib/index');

const gladys = {
  event: {
    emit: fake.resolves(null),
  },
  variable: {
    setValue: fake.resolves(null),
  },
  device: {
    setParam: fake.resolves(null),
  },
  stateManager: {
    get: fake.returns(null),
  },
};
const serviceId = 'serviceId';

const netatmoHandler = new NetatmoHandler(gladys, FfmpegMock, childProcessMock, serviceId);

describe('Netatmo update features type', () => {
  beforeEach(() => {
    sinon.reset();
    nock.cleanAll();

    netatmoHandler.status = 'not_initialized';
  });

  afterEach(() => {
    sinon.reset();
    nock.cleanAll();
  });

  it('should not update values if not reachable', async () => {
    deviceNetatmoNAPlug.reachable = false;
    await netatmoHandler.updateValues(deviceGladysNAPlug, deviceNetatmoNAPlug, externalIdNAPlug);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(0);
  });

  it('should update device values for a NAPlug device', async () => {
    deviceNetatmoNAPlug.reachable = true;
    await netatmoHandler.updateValues(deviceGladysNAPlug, deviceNetatmoNAPlug, externalIdNAPlug);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(deviceGladysNAPlug.features.length);
  });

  it('should save all values according for a NATherm1 device', async () => {
    await netatmoHandler.updateValues(deviceGladysNATherm1, deviceNetatmoNATherm1, externalIdNATherm1);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(7);
  });

  it('should save all values according for a NRV device', async () => {
    await netatmoHandler.updateValues(deviceGladysNRV, deviceNetatmoNRV, externalIdNRV);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(6);
  });

  it('should save all values according for a NAMain device', async () => {
    const deviceGladysNAMain = JSON.parse(JSON.stringify(devicesGladys[4]));
    const deviceNetatmoNAMain = JSON.parse(JSON.stringify(devicesNetatmo[4]));
    const externalIdNAMain = `netatmo:${deviceNetatmoNAMain.id}`;
    await netatmoHandler.updateValues(deviceGladysNAMain, deviceNetatmoNAMain, externalIdNAMain);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(10);
  });

  it('should save all values according for a NAModule1 device', async () => {
    await netatmoHandler.updateValues(deviceGladysNAModule1, deviceNetatmoNAModule1, externalIdNAModule1);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(6);
  });

  it('should save all values according for a NAModule2 device', async () => {
    await netatmoHandler.updateValues(deviceGladysNAModule2, deviceNetatmoNAModule2, externalIdNAModule2);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(8);
  });

  it('should save all values according for a NAModule3 device', async () => {
    await netatmoHandler.updateValues(deviceGladysNAModule3, deviceNetatmoNAModule3, externalIdNAModule3);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(5);
  });

  it('should save all values according for a NAModule4 device', async () => {
    await netatmoHandler.updateValues(deviceGladysNAModule4, deviceNetatmoNAModule4, externalIdNAModule4);

    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(8);
  });

  it('should save params and save all values according for a NACamera device with localUrl', async () => {
    nock('https://prodvpn-eu-2.netatmo.net/10.255.0.1/d257xxxxxxxxxxxxx/MTU4NDDr-aMZIkmaaLLg,,')
      .get('/command/ping')
      .reply(200, { local_url: 'http://192.168.128.232/52ced8bcc8149xxxxxxxxxx', type: 'nsv', status: 'ok' });

    nock('http://192.168.128.232/52ced8bcc8149xxxxxxxxxx')
      .get('/command/ping')
      .reply(200, { local_url: 'http://192.168.128.232/52ced8bcc8149xxxxxxxxxx', type: 'nsv', status: 'ok' });

    netatmoHandler.gladys.device.setParam = sinon.stub().resolves();
    netatmoHandler.gladys.stateManager.get = sinon.stub().returns(deviceGladysNACamera);
    netatmoHandler.getImage = sinon.fake.resolves('base64image');

    await netatmoHandler.updateValues(deviceGladysNACamera, deviceNetatmoNACamera, externalIdNACamera);

    sinon.assert.calledWith(
      netatmoHandler.gladys.device.setParam,
      deviceGladysNACamera,
      'CAMERA_URL',
      'http://192.168.128.232/52ced8bcc8149xxxxxxxxxx/live/files/high/index.m3u8',
    );
    sinon.assert.calledWith(netatmoHandler.gladys.stateManager.get, 'deviceByExternalId', externalIdNACamera);
    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(3);
  });

  it('should not update param but update only values NACamera device with vpnUrl', async () => {
    deviceNetatmoNACamera.is_local = undefined;
    netatmoHandler.gladys.device.setParam = sinon.stub().resolves();
    netatmoHandler.gladys.stateManager.get = sinon.stub().returns(deviceGladysNACamera);
    netatmoHandler.getImage = sinon.fake.resolves('base64image');

    await netatmoHandler.updateValues(deviceGladysNACamera, deviceNetatmoNACamera, externalIdNACamera);

    sinon.assert.notCalled(netatmoHandler.gladys.device.setParam);
    sinon.assert.notCalled(netatmoHandler.gladys.stateManager.get);
    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(3);
  });

  it('should save params for a NACamera device with vpnUrl', async () => {
    nock('https://prodvpn-eu-2.netatmo.net/10.255.0.1/d257xxxxxxxxxxxxx/MTU4NDDr-aMZIkmaaLLg,,')
      .get('/command/ping')
      .reply(200, { local_url: 'http://192.168.128.232/52ced8bcc8149xxxxxxxxxx', type: 'nsv', status: 'ok' });

    nock('http://192.168.128.232/52ced8bcc8149xxxxxxxxxx')
      .get('/command/ping')
      .reply(200, { local_url: '', type: 'nsv', status: 'ok' });

    deviceNetatmoNACamera.is_local = true;
    netatmoHandler.gladys.device.setParam = sinon.stub().resolves();
    netatmoHandler.gladys.stateManager.get = sinon.stub().returns(deviceGladysNACamera);
    netatmoHandler.updateNACamera = sinon.stub().resolves();

    await netatmoHandler.updateValues(deviceGladysNACamera, deviceNetatmoNACamera, externalIdNACamera);

    sinon.assert.calledWith(
      netatmoHandler.gladys.device.setParam,
      deviceGladysNACamera,
      'CAMERA_URL',
      'https://prodvpn-eu-2.netatmo.net/10.255.0.1/d257xxxxxxxxxxxxx/MTU4NDDr-aMZIkmaaLLg,,/live/files/high/index.m3u8',
    );
    sinon.assert.calledWith(netatmoHandler.gladys.stateManager.get, 'deviceByExternalId', externalIdNACamera);
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

  it('should save params and save all values according for a NACamera device with localUrl', async () => {
    const deviceGladys = { ...JSON.parse(JSON.stringify(devicesGladys[9])) };
    const deviceNetatmo = { ...JSON.parse(JSON.stringify(devicesNetatmo[9])) };
    const externalId = `netatmo:${deviceNetatmo.id}`;
    nock('https://prodvpn-eu-2.netatmo.net/10.255.0.1/d257xxxxxxxxxxxxx/MTU4NDDr-aMZIkmaaLLg,,')
      .get('/command/ping')
      .reply(200, { local_url: 'http://192.168.128.232/52ced8bcc8149xxxxxxxxxx', type: 'nsv', status: 'ok' });

    nock('http://192.168.128.232/52ced8bcc8149xxxxxxxxxx')
      .get('/command/ping')
      .reply(200, { local_url: 'http://192.168.128.232/52ced8bcc8149xxxxxxxxxx', type: 'nsv', status: 'ok' });

    netatmoHandler.gladys.device.setParam = sinon.stub().resolves();
    netatmoHandler.gladys.stateManager.get = sinon.stub().returns(deviceGladys);
    netatmoHandler.getImage = sinon.fake.resolves('base64image');

    await netatmoHandler.updateValues(deviceGladys, deviceNetatmo, externalId);

    sinon.assert.calledWith(
      netatmoHandler.gladys.device.setParam,
      deviceGladys,
      'CAMERA_URL',
      'http://192.168.128.232/52ced8bcc8149xxxxxxxxxx/live/files/high/index.m3u8',
    );
    sinon.assert.calledWith(netatmoHandler.gladys.stateManager.get, 'deviceByExternalId', externalId);
    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(3);
  });

  it('should not update param but update only values NACamera device with vpnUrl', async () => {
    const deviceGladys = { ...JSON.parse(JSON.stringify(devicesGladys[9])) };
    const deviceNetatmo = { ...JSON.parse(JSON.stringify(devicesNetatmo[9])) };
    const externalId = `netatmo:${deviceNetatmo.id}`;

    deviceNetatmo.is_local = undefined;
    netatmoHandler.gladys.device.setParam = sinon.stub().resolves();
    netatmoHandler.gladys.stateManager.get = sinon.stub().returns(deviceGladys);
    netatmoHandler.getImage = sinon.fake.resolves('base64image');

    await netatmoHandler.updateValues(deviceGladys, deviceNetatmo, externalId);

    sinon.assert.notCalled(netatmoHandler.gladys.device.setParam);
    sinon.assert.notCalled(netatmoHandler.gladys.stateManager.get);
    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(3);
  });

  it('should save params for a NACamera device with vpnUrl', async () => {
    const deviceGladys = { ...JSON.parse(JSON.stringify(devicesGladys[9])) };
    const deviceNetatmo = { ...JSON.parse(JSON.stringify(devicesNetatmo[9])) };
    const externalId = `netatmo:${deviceNetatmo.id}`;
    nock('https://prodvpn-eu-2.netatmo.net/10.255.0.1/d257xxxxxxxxxxxxx/MTU4NDDr-aMZIkmaaLLg,,')
      .get('/command/ping')
      .reply(200, { local_url: 'http://192.168.128.232/52ced8bcc8149xxxxxxxxxx', type: 'nsv', status: 'ok' });

    nock('http://192.168.128.232/52ced8bcc8149xxxxxxxxxx')
      .get('/command/ping')
      .reply(200, { local_url: '', type: 'nsv', status: 'ok' });

    deviceNetatmo.is_local = true;
    netatmoHandler.gladys.device.setParam = sinon.stub().resolves();
    netatmoHandler.gladys.stateManager.get = sinon.stub().returns(deviceGladys);
    netatmoHandler.updateNACamera = sinon.stub().resolves();

    await netatmoHandler.updateValues(deviceGladys, deviceNetatmo, externalId);

    sinon.assert.calledWith(
      netatmoHandler.gladys.device.setParam,
      deviceGladys,
      'CAMERA_URL',
      'https://prodvpn-eu-2.netatmo.net/10.255.0.1/d257xxxxxxxxxxxxx/MTU4NDDr-aMZIkmaaLLg,,/live/files/high/index.m3u8',
    );
    sinon.assert.calledWith(netatmoHandler.gladys.stateManager.get, 'deviceByExternalId', externalId);
  });
});
