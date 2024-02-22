const { expect } = require('chai');
const sinon = require('sinon');

const { SUPPORTED_MODULE_TYPE } = require('../../../../../services/netatmo/lib/utils/netatmo.constants');
const devicesNetatmoMock = JSON.parse(JSON.stringify(require('../../netatmo.loadDevices.mock.test.json')));
const devicesGladysMock = JSON.parse(JSON.stringify(require('../../netatmo.convertDevices.mock.test.json')));
const NetatmoHandler = require('../../../../../services/netatmo/lib/index');

const gladys = {};
const serviceId = 'serviceId';
const netatmoHandler = new NetatmoHandler(gladys, serviceId);

describe('Netatmo Convert Energy Device', () => {
  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should correctly convert a Netatmo Plug device', () => {
    const deviceGladysMock = { ...devicesGladysMock.filter((device) => device.model === 'NAPlug')[0] };
    const deviceNetatmoMock = { ...devicesNetatmoMock.filter((device) => device.type === 'NAPlug')[0] };

    const gladysDevice = netatmoHandler.convertDeviceEnergy(deviceNetatmoMock);

    expect(gladysDevice).deep.equal(deviceGladysMock);
    expect(gladysDevice.features).deep.equal(deviceGladysMock.features);
    expect(gladysDevice.params).deep.equal(deviceGladysMock.params);

    expect(gladysDevice).to.have.property('name', deviceGladysMock.name);
    expect(gladysDevice).to.have.property('external_id', `netatmo:${deviceNetatmoMock.id}`);
    expect(gladysDevice).to.have.property('model', SUPPORTED_MODULE_TYPE.PLUG);

    const featureMock = gladysDevice.features.filter((feature) => feature.name.includes('connected boiler'))[0];
    expect(featureMock).to.have.property('external_id', `netatmo:${deviceNetatmoMock.id}:plug_connected_boiler`);

    const paramMock = gladysDevice.params.filter((param) => param.name === 'modules_bridge_id')[0];
    expect(paramMock).to.have.property('value', JSON.stringify(deviceNetatmoMock.modules_bridged));

    expect(gladysDevice.features).to.be.an('array');
    expect(gladysDevice.params).to.be.an('array');
  });

  it('should correctly convert a Netatmo Thermostat device', () => {
    const deviceGladysMock = { ...devicesGladysMock.filter((device) => device.model === 'NATherm1')[0] };
    const deviceNetatmoMock = { ...devicesNetatmoMock.filter((device) => device.type === 'NATherm1')[0] };

    const gladysDevice = netatmoHandler.convertDeviceEnergy(deviceNetatmoMock);

    expect(gladysDevice).deep.equal(deviceGladysMock);
    expect(gladysDevice.features).deep.equal(deviceGladysMock.features);
    expect(gladysDevice.params).deep.equal(deviceGladysMock.params);

    expect(gladysDevice).to.have.property('name', deviceGladysMock.name);
    expect(gladysDevice).to.have.property('external_id', `netatmo:${deviceNetatmoMock.id}`);
    expect(gladysDevice).to.have.property('model', SUPPORTED_MODULE_TYPE.THERMOSTAT);

    const featureMock = gladysDevice.features.filter((feature) => feature.type === 'target-temperature')[0];
    expect(featureMock).to.have.property('external_id', `netatmo:${deviceNetatmoMock.id}:therm_setpoint_temperature`);

    const paramMock = gladysDevice.params.filter((param) => param.name === 'plug_name')[0];
    expect(paramMock).to.have.property('value', deviceNetatmoMock.plug.name);

    expect(gladysDevice.features).to.be.an('array');
    expect(gladysDevice.params).to.be.an('array');
  });

  it('should correctly convert a Netatmo Thermostat device without room and without plug', () => {
    const deviceGladysMock = { ...devicesGladysMock.filter((device) => device.model === 'NATherm1')[0] };
    const deviceNetatmoMock = { ...devicesNetatmoMock.filter((device) => device.type === 'NATherm1')[0] };
    const roomNameParam = deviceGladysMock.params.find((param) => param.name === 'room_name');
    if (roomNameParam) {
      deviceGladysMock.features.forEach((feature) => {
        if (feature.category === 'temperature-sensor') {
          feature.name = feature.name.replace(roomNameParam.value, 'undefined');
        }
      });
    }
    deviceGladysMock.features = deviceGladysMock.features.filter(
      (feature) => feature.external_id !== 'netatmo:04:00:00:xx:xx:xx:therm_measured_temperature',
    );
    deviceGladysMock.params = deviceGladysMock.params.filter(
      (param) => param.name !== 'room_name' && param.name !== 'room_id',
    );
    deviceGladysMock.params = [
      {
        name: 'home_id',
        value: '5e1xxxxxxxxxxxxxxxxx',
      },
    ];
    deviceNetatmoMock.room = undefined;
    deviceNetatmoMock.plug = undefined;

    const gladysDevice = netatmoHandler.convertDeviceEnergy(deviceNetatmoMock);

    expect(gladysDevice).deep.equal(deviceGladysMock);
    expect(gladysDevice.features).deep.equal(deviceGladysMock.features);
    expect(gladysDevice.params).deep.equal(deviceGladysMock.params);

    expect(gladysDevice).to.have.property('name', deviceGladysMock.name);
    expect(gladysDevice).to.have.property('external_id', `netatmo:${deviceNetatmoMock.id}`);
    expect(gladysDevice).to.have.property('model', SUPPORTED_MODULE_TYPE.THERMOSTAT);

    const featureMock = gladysDevice.features.filter((feature) => feature.category === 'temperature-sensor');
    expect(featureMock[0]).to.have.property('external_id', `netatmo:${deviceNetatmoMock.id}:temperature`);
    expect(featureMock.length).to.deep.equal(1);

    const paramMock = gladysDevice.params.filter((param) => param.name === 'plug_name')[0];
    expect(paramMock).to.deep.equal(undefined);

    expect(gladysDevice.features).to.be.an('array');
    expect(gladysDevice.params).to.be.an('array');
  });

  it('should correctly convert a Netatmo Valve device', () => {
    const deviceGladysMock = { ...devicesGladysMock.filter((device) => device.model === 'NRV')[0] };
    const deviceNetatmoMock = { ...devicesNetatmoMock.filter((device) => device.type === 'NRV')[0] };

    const gladysDevice = netatmoHandler.convertDeviceEnergy(deviceNetatmoMock);

    expect(gladysDevice).deep.equal(deviceGladysMock);
    expect(gladysDevice.features).deep.equal(deviceGladysMock.features);
    expect(gladysDevice.params).deep.equal(deviceGladysMock.params);

    expect(gladysDevice).to.have.property('name', deviceGladysMock.name);
    expect(gladysDevice).to.have.property('external_id', `netatmo:${deviceNetatmoMock.id}`);
    expect(gladysDevice).to.have.property('model', SUPPORTED_MODULE_TYPE.NRV);

    const featureMock = gladysDevice.features.filter((feature) => feature.type === 'target-temperature')[0];
    expect(featureMock).to.have.property('external_id', `netatmo:${deviceNetatmoMock.id}:therm_setpoint_temperature`);

    const paramMock = gladysDevice.params.filter((param) => param.name === 'plug_name')[0];
    expect(paramMock).to.have.property('value', deviceNetatmoMock.plug.name);

    expect(gladysDevice.features).to.be.an('array');
    expect(gladysDevice.params).to.be.an('array');
  });

  it('should correctly convert a Netatmo Valve device with secondaries names and ids', () => {
    const deviceGladysMock = { ...devicesGladysMock.filter((device) => device.model === 'NRV')[0] };
    const deviceNetatmoMock = { ...devicesNetatmoMock.filter((device) => device.type === 'NRV')[0] };
    deviceNetatmoMock._id = deviceNetatmoMock.id;
    deviceNetatmoMock.id = undefined;
    deviceNetatmoMock.home_id = deviceNetatmoMock.home;
    deviceNetatmoMock.home = undefined;
    deviceNetatmoMock.module_name = deviceNetatmoMock.name;
    deviceNetatmoMock.name = undefined;
    deviceNetatmoMock.plug._id = deviceNetatmoMock.plug.id;
    deviceNetatmoMock.plug.id = undefined;
    deviceNetatmoMock.plug.module_name = deviceNetatmoMock.plug.name;
    deviceNetatmoMock.plug.name = undefined;

    const gladysDevice = netatmoHandler.convertDeviceEnergy(deviceNetatmoMock);

    expect(gladysDevice).deep.equal(deviceGladysMock);
    expect(gladysDevice.features).deep.equal(deviceGladysMock.features);
    expect(gladysDevice.params).deep.equal(deviceGladysMock.params);

    expect(gladysDevice).to.have.property('name', deviceGladysMock.name);
    expect(gladysDevice).to.have.property('external_id', `netatmo:${deviceNetatmoMock._id}`);
    expect(gladysDevice).to.have.property('model', SUPPORTED_MODULE_TYPE.NRV);

    const featureMock = gladysDevice.features.filter((feature) => feature.type === 'target-temperature')[0];
    expect(featureMock).to.have.property('external_id', `netatmo:${deviceNetatmoMock._id}:therm_setpoint_temperature`);

    const paramMock = gladysDevice.params.filter((param) => param.name === 'plug_name')[0];
    expect(paramMock).to.have.property('value', deviceNetatmoMock.plug.module_name);

    expect(gladysDevice.features).to.be.an('array');
    expect(gladysDevice.params).to.be.an('array');
  });

  it('should correctly convert a Netatmo Valve device without room and without plug', () => {
    const deviceGladysMock = { ...devicesGladysMock.filter((device) => device.model === 'NRV')[0] };
    const deviceNetatmoMock = { ...devicesNetatmoMock.filter((device) => device.type === 'NRV')[0] };
    const roomNameParam = deviceGladysMock.params.find((param) => param.name === 'room_name');
    if (roomNameParam) {
      deviceGladysMock.features.forEach((feature) => {
        if (feature.category === 'temperature-sensor') {
          feature.name = feature.name.replace(roomNameParam.value, 'undefined');
        }
      });
    }
    deviceGladysMock.features = deviceGladysMock.features.filter(
      (feature) => feature.external_id !== 'netatmo:09:00:00:xx:xx:xx:therm_measured_temperature',
    );
    deviceGladysMock.params = deviceGladysMock.params.filter(
      (param) => param.name !== 'room_name' && param.name !== 'room_id',
    );
    deviceGladysMock.params = [
      {
        name: 'home_id',
        value: '5e1xxxxxxxxxxxxxxxxx',
      },
    ];
    deviceNetatmoMock.room = undefined;
    deviceNetatmoMock.plug = undefined;

    const gladysDevice = netatmoHandler.convertDeviceEnergy(deviceNetatmoMock);

    expect(gladysDevice).deep.equal(deviceGladysMock);
    expect(gladysDevice.features).deep.equal(deviceGladysMock.features);
    expect(gladysDevice.params).deep.equal(deviceGladysMock.params);

    expect(gladysDevice).to.have.property('name', deviceGladysMock.name);
    expect(gladysDevice).to.have.property('external_id', `netatmo:${deviceNetatmoMock.id}`);
    expect(gladysDevice).to.have.property('model', SUPPORTED_MODULE_TYPE.NRV);

    const featureMock = gladysDevice.features.filter((feature) => feature.category === 'temperature-sensor');
    expect(featureMock.length).to.deep.equal(0);

    const paramMock = gladysDevice.params.filter((param) => param.name === 'plug_name')[0];
    expect(paramMock).to.deep.equal(undefined);

    expect(gladysDevice.features).to.be.an('array');
    expect(gladysDevice.params).to.be.an('array');
  });

  it('should correctly convert a Netatmo device without room and without modules_bridged', () => {
    const deviceGladysMock = { ...devicesGladysMock.filter((device) => device.model === 'NAPlug')[1] };
    const deviceNetatmoMock = { ...devicesNetatmoMock.filter((device) => device.type === 'NAPlug')[1] };
    deviceNetatmoMock.modules_bridged = undefined;

    const gladysDevice = netatmoHandler.convertDeviceEnergy(deviceNetatmoMock);

    expect(gladysDevice).deep.equal(deviceGladysMock);
    expect(gladysDevice.features).deep.equal(deviceGladysMock.features);
    expect(gladysDevice.params).deep.equal(deviceGladysMock.params);

    expect(gladysDevice).to.have.property('name', deviceGladysMock.name);
    expect(gladysDevice).to.have.property('external_id', `netatmo:${deviceNetatmoMock.id}`);
    expect(gladysDevice).to.have.property('model', SUPPORTED_MODULE_TYPE.PLUG);

    const featureMock = gladysDevice.features.filter((feature) => feature.name.includes('connected boiler'))[0];
    expect(featureMock).to.have.property('external_id', `netatmo:${deviceNetatmoMock.id}:plug_connected_boiler`);

    const paramMock = gladysDevice.params.filter((param) => param.name === 'modules_bridge_id')[0];
    expect(paramMock).deep.equal({ name: 'modules_bridge_id', value: '[]' });

    const paramRoomMock = gladysDevice.params.filter((param) => param.name === 'room_name')[0];
    expect(paramRoomMock).to.equal(undefined);
  });

  it('should correctly convert a Netatmo device not supported', () => {
    const deviceGladysMock = { ...devicesGladysMock.filter((device) => device.not_handled)[0] };
    const deviceNetatmoMock = { ...devicesNetatmoMock.filter((device) => device.type === 'NOC')[0] };

    const gladysDevice = netatmoHandler.convertDeviceEnergy(deviceNetatmoMock);

    expect(gladysDevice).deep.equal(deviceGladysMock);
    expect(gladysDevice.features).deep.equal([]);
    expect(gladysDevice.params).deep.equal(deviceGladysMock.params);

    expect(gladysDevice).to.have.property('name', deviceGladysMock.name);
    expect(gladysDevice).to.have.property('external_id', `netatmo:${deviceNetatmoMock.id}`);
    expect(gladysDevice).to.have.property('model', 'NOC');

    const paramMock = gladysDevice.params.filter((param) => param.name === 'room_name')[0];
    expect(paramMock).to.have.property('value', deviceNetatmoMock.room.name);
  });
});
