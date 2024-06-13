const { expect } = require('chai');
const sinon = require('sinon');

const { SUPPORTED_MODULE_TYPE } = require('../../../../../services/netatmo/lib/utils/netatmo.constants');
const devicesNetatmoMock = require('../../netatmo.loadDevices.mock.test.json');
const devicesGladysMock = require('../../netatmo.convertDevices.mock.test.json');
const { FfmpegMock, childProcessMock } = require('../../FfmpegMock.test');
const NetatmoHandler = require('../../../../../services/netatmo/lib/index');

const gladys = {};
const serviceId = 'serviceId';
const netatmoHandler = new NetatmoHandler(gladys, FfmpegMock, childProcessMock, serviceId);

describe('Netatmo Convert Security Device', () => {
  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should correctly convert a Netatmo Security NACamera local device', () => {
    const deviceGladysMock = devicesGladysMock.filter((device) => device.model === 'NACamera')[0];
    const deviceNetatmoMock = devicesNetatmoMock.filter((device) => device.type === 'NACamera')[0];

    const gladysDevice = netatmoHandler.convertDeviceSecurity(deviceNetatmoMock);

    expect(gladysDevice).deep.equal(deviceGladysMock);
    expect(gladysDevice.features).deep.equal(deviceGladysMock.features);
    expect(gladysDevice.params).deep.equal(deviceGladysMock.params);

    expect(gladysDevice).to.have.property('name', deviceGladysMock.name);
    expect(gladysDevice).to.have.property('external_id', `netatmo:${deviceNetatmoMock.id}`);
    expect(gladysDevice).to.have.property('model', SUPPORTED_MODULE_TYPE.NACAMERA);

    const featureMock = gladysDevice.features.filter((feature) => feature.category === 'camera')[0];
    expect(featureMock).to.have.property('external_id', `netatmo:${deviceNetatmoMock.id}:camera`);

    const paramMock = gladysDevice.params.filter((param) => param.name === 'CAMERA_ROTATION')[0];
    expect(paramMock).to.have.property('value', 0);

    expect(gladysDevice.features).to.be.an('array');
    expect(gladysDevice.params).to.be.an('array');
  });

  it('should correctly convert a Netatmo Security NACamera no local device', () => {
    const deviceGladysMock = devicesGladysMock.filter((device) => device.model === 'NACamera')[0];
    const deviceNetatmoMock = devicesNetatmoMock.filter((device) => device.type === 'NACamera')[0];
    deviceGladysMock.params
      .filter((param) => param.name === 'CAMERA_URL')
      .forEach((param) => {
        const { value } = param;
        param.value = value.replace('index_local', 'index');
      });
    deviceNetatmoMock.is_local = false;

    const gladysDevice = netatmoHandler.convertDeviceSecurity(deviceNetatmoMock);

    expect(gladysDevice).deep.equal(deviceGladysMock);
    expect(gladysDevice.features).deep.equal(deviceGladysMock.features);
    expect(gladysDevice.params).deep.equal(deviceGladysMock.params);

    expect(gladysDevice).to.have.property('name', deviceGladysMock.name);
    expect(gladysDevice).to.have.property('external_id', `netatmo:${deviceNetatmoMock.id}`);
    expect(gladysDevice).to.have.property('model', SUPPORTED_MODULE_TYPE.NACAMERA);

    const featureMock = gladysDevice.features.filter((feature) => feature.category === 'camera')[0];
    expect(featureMock).to.have.property('external_id', `netatmo:${deviceNetatmoMock.id}:camera`);

    const paramMock = gladysDevice.params.filter((param) => param.name === 'CAMERA_URL')[0];
    expect(paramMock).to.have.property(
      'value',
      'https://prodvpn-eu-2.netatmo.net/10.255.0.1/d257xxxxxxxxxxxxx/MTU4NDDr-aMZIkmaaLLg,,/live/files/high/index.m3u8',
    );

    expect(gladysDevice.features).to.be.an('array');
    expect(gladysDevice.params).to.be.an('array');
  });

  it('should correctly convert a Netatmo Security device without modules_bridged and without room', () => {
    const deviceGladysMock = devicesGladysMock.filter((device) => device.model === 'NACamera')[0];
    const roomNameParam = deviceGladysMock.params.find((param) => param.name === 'room_name');
    if (roomNameParam) {
      deviceGladysMock.features.forEach((feature) => {
        if (feature.category === 'temperature-sensor') {
          feature.name = feature.name.replace(roomNameParam.value, 'undefined');
        }
      });
    }
    deviceGladysMock.params = deviceGladysMock.params.filter(
      (param) => param.name !== 'room_name' && param.name !== 'room_id',
    );
    deviceGladysMock.params
      .filter((param) => param.name === 'modules_bridge_id')
      .forEach((param) => {
        param.value = '[]';
      });
    const deviceNetatmoMock = devicesNetatmoMock.filter((device) => device.type === 'NACamera')[0];
    deviceNetatmoMock.room = undefined;
    deviceNetatmoMock.modules_bridged = undefined;

    const gladysDevice = netatmoHandler.convertDeviceSecurity(deviceNetatmoMock);

    expect(gladysDevice).deep.equal(deviceGladysMock);
    expect(gladysDevice.features).deep.equal(deviceGladysMock.features);
    expect(gladysDevice.params).deep.equal(deviceGladysMock.params);

    expect(gladysDevice).to.have.property('name', deviceGladysMock.name);
    expect(gladysDevice).to.have.property('external_id', `netatmo:${deviceNetatmoMock.id}`);
    expect(gladysDevice).to.have.property('model', SUPPORTED_MODULE_TYPE.NACAMERA);

    const paramMock = gladysDevice.params.filter((param) => param.name === 'modules_bridge_id')[0];
    expect(paramMock).deep.equal({ name: 'modules_bridge_id', value: '[]' });

    const paramRoomMock = gladysDevice.params.filter((param) => param.name === 'room_name')[0];
    expect(paramRoomMock).to.equal(undefined);
  });

  it('should correctly convert a Netatmo device not supported', () => {
    const deviceGladysMock = devicesGladysMock.filter((device) => device.not_handled)[0];
    const deviceNetatmoMock = devicesNetatmoMock.filter((device) => device.type === 'NOC')[0];

    const gladysDevice = netatmoHandler.convertDeviceSecurity(deviceNetatmoMock);

    expect(gladysDevice).deep.equal(deviceGladysMock);
    expect(gladysDevice.features).deep.equal([]);
    expect(gladysDevice.params).deep.equal(deviceGladysMock.params);

    expect(gladysDevice).to.have.property('name', deviceGladysMock.name);
    expect(gladysDevice).to.have.property('external_id', `netatmo:${deviceNetatmoMock.id}`);
    expect(gladysDevice).to.have.property('model', 'NOC');
    expect(gladysDevice).to.have.property('not_handled', true);
  });
});
