const { expect } = require('chai');
const sinon = require('sinon');

const { convertDevice } = require('../../../../../services/netatmo/lib/device/netatmo.convertDevice');
const { SUPPORTED_MODULE_TYPE } = require('../../../../../services/netatmo/lib/utils/netatmo.constants');
const devicesNetatmoMock = require('../../netatmo.loadDevices.mock.test.json');
const devicesGladysMock = require('../../netatmo.convertDevices.mock.test.json');
const NetatmoHandler = require('../../../../../services/netatmo/lib/index');

const gladys = {};
const serviceId = 'serviceId';
const netatmoHandler = new NetatmoHandler(gladys, serviceId);

describe('Netatmo Convert Device', () => {
  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should correctly convert a Netatmo Plug device', () => {
    const deviceGladysMock = devicesGladysMock.filter((device) => device.model === 'NAPlug')[0];
    const deviceNetatmoMock = devicesNetatmoMock.filter((device) => device.type === 'NAPlug')[0];

    const gladysDevice = convertDevice.bind(netatmoHandler)(deviceNetatmoMock);

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
    const deviceGladysMock = devicesGladysMock.filter((device) => device.model === 'NATherm1')[0];
    const deviceNetatmoMock = devicesNetatmoMock.filter((device) => device.type === 'NATherm1')[0];

    const gladysDevice = convertDevice.bind(netatmoHandler)(deviceNetatmoMock);

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

  it('should correctly convert a Netatmo Valve device', () => {
    const deviceGladysMock = devicesGladysMock.filter((device) => device.model === 'NRV')[0];
    const deviceNetatmoMock = devicesNetatmoMock.filter((device) => device.type === 'NRV')[0];

    const gladysDevice = convertDevice.bind(netatmoHandler)(deviceNetatmoMock);

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

  it('should correctly convert a Netatmo device not supported', () => {
    const deviceGladysMock = devicesGladysMock.filter((device) => device.not_handled)[0];
    const deviceNetatmoMock = devicesNetatmoMock.filter((device) => device.type === 'NOC')[0];

    const gladysDevice = convertDevice.bind(netatmoHandler)(deviceNetatmoMock);

    expect(gladysDevice).deep.equal(deviceGladysMock);
    expect(gladysDevice.features).deep.equal([]);
    expect(gladysDevice.params).deep.equal(deviceGladysMock.params);

    expect(gladysDevice).to.have.property('name', deviceGladysMock.name);
    expect(gladysDevice).to.have.property('external_id', `netatmo:${deviceNetatmoMock.id}`);
    expect(gladysDevice).to.have.property('model', 'NOC');

    const paramMock = gladysDevice.params.filter((param) => param.name === 'room_name')[0];
    expect(paramMock).to.have.property('value', deviceNetatmoMock.room.name);

    expect(gladysDevice.features).to.be.an('array');
    expect(gladysDevice.params).to.be.an('array');
  });

  it('should correctly convert a Netatmo device without room and without modules_bridged', () => {
    const deviceGladysMock = devicesGladysMock.filter((device) => device.model === 'NAPlug')[1];
    const deviceNetatmoMock = devicesNetatmoMock.filter((device) => device.type === 'NAPlug')[1];
    deviceNetatmoMock.modules_bridged = undefined;

    const gladysDevice = convertDevice.bind(netatmoHandler)(deviceNetatmoMock);

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

    expect(gladysDevice.features).to.be.an('array');
    expect(gladysDevice.params).to.be.an('array');
  });
});
