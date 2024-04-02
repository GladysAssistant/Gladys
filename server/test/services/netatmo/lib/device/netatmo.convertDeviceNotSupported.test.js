const { expect } = require('chai');
const sinon = require('sinon');

const devicesNetatmoMock = JSON.parse(JSON.stringify(require('../../netatmo.loadDevices.mock.test.json')));
const devicesGladysMock = JSON.parse(JSON.stringify(require('../../netatmo.convertDevices.mock.test.json')));
const NetatmoHandler = require('../../../../../services/netatmo/lib/index');

const gladys = {};
const serviceId = 'serviceId';
const netatmoHandler = new NetatmoHandler(gladys, serviceId);

describe('Netatmo Convert Device not supported', () => {
  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should correctly convert a Netatmo device not supported', () => {
    const deviceGladysMock = { ...devicesGladysMock.filter((device) => device.not_handled)[0] };
    const deviceNetatmoMock = { ...devicesNetatmoMock.filter((device) => device.type === 'NOC')[0] };

    const gladysDevice = netatmoHandler.convertDeviceNotSupported(deviceNetatmoMock);

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

  it('should correctly convert a Netatmo device without room and with secondary datas', () => {
    const deviceGladysMock = { ...devicesGladysMock.filter((device) => device.model === 'NOC')[0] };
    const deviceNetatmoMock = { ...devicesNetatmoMock.filter((device) => device.type === 'NOC')[0] };
    deviceGladysMock.params = deviceGladysMock.params.filter(
      (param) => param.name !== 'room_name' && param.name !== 'room_id',
    );
    deviceNetatmoMock._id = deviceNetatmoMock.id;
    deviceNetatmoMock.id = undefined;
    deviceNetatmoMock.home_id = deviceNetatmoMock.home;
    deviceNetatmoMock.home = undefined;
    deviceNetatmoMock.module_name = deviceNetatmoMock.name;
    deviceNetatmoMock.name = undefined;
    deviceNetatmoMock.room = undefined;

    const gladysDevice = netatmoHandler.convertDeviceNotSupported(deviceNetatmoMock);

    expect(gladysDevice).deep.equal(deviceGladysMock);
    expect(gladysDevice.features).deep.equal([]);
    expect(gladysDevice.params).deep.equal(deviceGladysMock.params);

    expect(gladysDevice).to.have.property('name', deviceGladysMock.name);
    expect(gladysDevice).to.have.property('external_id', `netatmo:${deviceNetatmoMock._id}`);
    expect(gladysDevice).to.have.property('model', 'NOC');

    const paramMock = gladysDevice.params.filter((param) => param.name === 'room_name')[0];
    expect(paramMock).to.equal(undefined);
  });

  it('should correctly convert a Netatmo device not supported with station_name', () => {
    const deviceGladysMock = { ...devicesGladysMock.filter((device) => device.not_handled)[0] };
    const deviceNetatmoMock = { ...devicesNetatmoMock.filter((device) => device.type === 'NOC')[0] };
    deviceNetatmoMock.station_name = deviceNetatmoMock.name;
    deviceNetatmoMock.module_name = undefined;
    deviceNetatmoMock.name = undefined;

    const gladysDevice = netatmoHandler.convertDeviceNotSupported(deviceNetatmoMock);

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
});
