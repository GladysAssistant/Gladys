const { expect } = require('chai');
const sinon = require('sinon');

const { SUPPORTED_MODULE_TYPE } = require('../../../../../services/netatmo/lib/utils/netatmo.constants');
const devicesNetatmoMock = require('../../netatmo.loadDevices.mock.test.json');
const devicesGladysMock = require('../../netatmo.convertDevices.mock.test.json');
const NetatmoHandler = require('../../../../../services/netatmo/lib/index');

const gladys = {};
const serviceId = 'serviceId';
const netatmoHandler = new NetatmoHandler(gladys, serviceId);

describe('Netatmo Convert Weather Device', () => {
  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should correctly convert a Netatmo Weather Station NAMain device', () => {
    const deviceGladysMock = devicesGladysMock.filter((device) => device.model === 'NAMain')[0];
    const deviceNetatmoMock = devicesNetatmoMock.filter((device) => device.type === 'NAMain')[0];

    const gladysDevice = netatmoHandler.convertDeviceWeather(deviceNetatmoMock);

    expect(gladysDevice).deep.equal(deviceGladysMock);
    expect(gladysDevice.features).deep.equal(deviceGladysMock.features);
    expect(gladysDevice.params).deep.equal(deviceGladysMock.params);

    expect(gladysDevice).to.have.property('name', deviceGladysMock.name);
    expect(gladysDevice).to.have.property('external_id', `netatmo:${deviceNetatmoMock.id}`);
    expect(gladysDevice).to.have.property('model', SUPPORTED_MODULE_TYPE.NAMAIN);

    const featureMock = gladysDevice.features.filter((feature) => feature.category === 'temperature-sensor')[2];
    expect(featureMock).to.have.property('external_id', `netatmo:${deviceNetatmoMock.id}:min_temp`);

    const paramMock = gladysDevice.params.filter((param) => param.name === 'modules_bridge_id')[0];
    expect(paramMock).to.have.property('value', JSON.stringify(deviceNetatmoMock.modules_bridged));

    expect(gladysDevice.features).to.be.an('array');
    expect(gladysDevice.params).to.be.an('array');
  });

  it('should correctly convert a Netatmo Outdoor module NAModule1 device', () => {
    const deviceGladysMock = devicesGladysMock.filter((device) => device.model === 'NAModule1')[0];
    const deviceNetatmoMock = devicesNetatmoMock.filter((device) => device.type === 'NAModule1')[0];

    const gladysDevice = netatmoHandler.convertDeviceWeather(deviceNetatmoMock);

    expect(gladysDevice).deep.equal(deviceGladysMock);
    expect(gladysDevice.features).deep.equal(deviceGladysMock.features);
    expect(gladysDevice.params).deep.equal(deviceGladysMock.params);

    expect(gladysDevice).to.have.property('name', deviceGladysMock.name);
    expect(gladysDevice).to.have.property('external_id', `netatmo:${deviceNetatmoMock.id}`);
    expect(gladysDevice).to.have.property('model', SUPPORTED_MODULE_TYPE.NAMODULE1);

    const featureMock = gladysDevice.features.filter((feature) => feature.category === 'humidity-sensor')[0];
    expect(featureMock).to.have.property('external_id', `netatmo:${deviceNetatmoMock.id}:humidity`);

    const paramMock = gladysDevice.params.filter((param) => param.name === 'plug_name')[0];
    expect(paramMock).to.have.property('value', deviceNetatmoMock.plug.name);

    expect(gladysDevice.features).to.be.an('array');
    expect(gladysDevice.params).to.be.an('array');
  });

  it('should correctly convert a Netatmo Anemometer NAModule2 device', () => {
    const deviceGladysMock = devicesGladysMock.filter((device) => device.model === 'NAModule2')[0];
    const deviceNetatmoMock = devicesNetatmoMock.filter((device) => device.type === 'NAModule2')[0];

    const gladysDevice = netatmoHandler.convertDeviceWeather(deviceNetatmoMock);

    expect(gladysDevice).deep.equal(deviceGladysMock);
    expect(gladysDevice.features).deep.equal(deviceGladysMock.features);
    expect(gladysDevice.params).deep.equal(deviceGladysMock.params);

    expect(gladysDevice).to.have.property('name', deviceGladysMock.name);
    expect(gladysDevice).to.have.property('external_id', `netatmo:${deviceNetatmoMock.id}`);
    expect(gladysDevice).to.have.property('model', SUPPORTED_MODULE_TYPE.NAMODULE2);

    const featureMock = gladysDevice.features.filter((feature) => feature.category === 'speed-sensor')[0];
    expect(featureMock).to.have.property('external_id', `netatmo:${deviceNetatmoMock.id}:wind_strength`);

    const paramMock = gladysDevice.params.filter((param) => param.name === 'plug_name')[0];
    expect(paramMock).to.have.property('value', deviceNetatmoMock.plug.name);

    expect(gladysDevice.features).to.be.an('array');
    expect(gladysDevice.params).to.be.an('array');
  });

  it('should correctly convert a Netatmo Rain gauge Weather Station NAModule3 device', () => {
    const deviceGladysMock = devicesGladysMock.filter((device) => device.model === 'NAModule3')[0];
    const deviceNetatmoMock = devicesNetatmoMock.filter((device) => device.type === 'NAModule3')[0];

    const gladysDevice = netatmoHandler.convertDeviceWeather(deviceNetatmoMock);

    expect(gladysDevice).deep.equal(deviceGladysMock);
    expect(gladysDevice.features).deep.equal(deviceGladysMock.features);
    expect(gladysDevice.params).deep.equal(deviceGladysMock.params);

    expect(gladysDevice).to.have.property('name', deviceGladysMock.name);
    expect(gladysDevice).to.have.property('external_id', `netatmo:${deviceNetatmoMock.id}`);
    expect(gladysDevice).to.have.property('model', SUPPORTED_MODULE_TYPE.NAMODULE3);

    const featureMock = gladysDevice.features.filter((feature) => feature.category === 'precipitation-sensor')[2];
    expect(featureMock).to.have.property('external_id', `netatmo:${deviceNetatmoMock.id}:sum_rain_24`);

    const paramMock = gladysDevice.params.filter((param) => param.name === 'plug_name')[0];
    expect(paramMock).to.have.property('value', deviceNetatmoMock.plug.name);

    expect(gladysDevice.features).to.be.an('array');
    expect(gladysDevice.params).to.be.an('array');
  });

  it('should correctly convert a Netatmo Indoor module Weather Station NAModule4 device', () => {
    const deviceGladysMock = devicesGladysMock.filter((device) => device.model === 'NAModule4')[0];
    const deviceNetatmoMock = devicesNetatmoMock.filter((device) => device.type === 'NAModule4')[0];

    const gladysDevice = netatmoHandler.convertDeviceWeather(deviceNetatmoMock);

    expect(gladysDevice).deep.equal(deviceGladysMock);
    expect(gladysDevice.features).deep.equal(deviceGladysMock.features);
    expect(gladysDevice.params).deep.equal(deviceGladysMock.params);

    expect(gladysDevice).to.have.property('name', deviceGladysMock.name);
    expect(gladysDevice).to.have.property('external_id', `netatmo:${deviceNetatmoMock.id}`);
    expect(gladysDevice).to.have.property('model', SUPPORTED_MODULE_TYPE.NAMODULE4);

    const featureMock = gladysDevice.features.filter((feature) => feature.category === 'temperature-sensor')[2];
    expect(featureMock).to.have.property('external_id', `netatmo:${deviceNetatmoMock.id}:min_temp`);

    const paramMock = gladysDevice.params.filter((param) => param.name === 'plug_name')[0];
    expect(paramMock).to.have.property('value', deviceNetatmoMock.plug.name);

    expect(gladysDevice.features).to.be.an('array');
    expect(gladysDevice.params).to.be.an('array');
  });

  it('should correctly convert a Netatmo Weather Station device without modules_bridged and without room', () => {
    const deviceGladysMock = devicesGladysMock.filter((device) => device.model === 'NAMain')[0];
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
    const deviceNetatmoMock = devicesNetatmoMock.filter((device) => device.type === 'NAMain')[0];
    deviceNetatmoMock.room = undefined;
    deviceNetatmoMock.modules_bridged = undefined;

    const gladysDevice = netatmoHandler.convertDeviceWeather(deviceNetatmoMock);

    expect(gladysDevice).deep.equal(deviceGladysMock);
    expect(gladysDevice.features).deep.equal(deviceGladysMock.features);
    expect(gladysDevice.params).deep.equal(deviceGladysMock.params);

    expect(gladysDevice).to.have.property('name', deviceGladysMock.name);
    expect(gladysDevice).to.have.property('external_id', `netatmo:${deviceNetatmoMock.id}`);
    expect(gladysDevice).to.have.property('model', SUPPORTED_MODULE_TYPE.NAMAIN);

    const paramMock = gladysDevice.params.filter((param) => param.name === 'modules_bridge_id')[0];
    expect(paramMock).deep.equal({ name: 'modules_bridge_id', value: '[]' });

    const paramRoomMock = gladysDevice.params.filter((param) => param.name === 'room_name')[0];
    expect(paramRoomMock).to.equal(undefined);
  });

  it('should correctly convert a Netatmo device not supported', () => {
    const deviceGladysMock = devicesGladysMock.filter((device) => device.not_handled)[0];
    const deviceNetatmoMock = devicesNetatmoMock.filter((device) => device.type === 'NOC')[0];

    const gladysDevice = netatmoHandler.convertDeviceWeather(deviceNetatmoMock);

    expect(gladysDevice).deep.equal(deviceGladysMock);
    expect(gladysDevice.features).deep.equal([]);
    expect(gladysDevice.params).deep.equal(deviceGladysMock.params);

    expect(gladysDevice).to.have.property('name', deviceGladysMock.name);
    expect(gladysDevice).to.have.property('external_id', `netatmo:${deviceNetatmoMock.id}`);
    expect(gladysDevice).to.have.property('model', 'NOC');
    expect(gladysDevice).to.have.property('not_handled', true);
  });
});
