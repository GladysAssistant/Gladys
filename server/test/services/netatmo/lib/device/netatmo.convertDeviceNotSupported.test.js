const { expect } = require('chai');
const sinon = require('sinon');

const devicesNetatmoMock = require('../../netatmo.loadDevices.mock.test.json');
const devicesGladysMock = require('../../netatmo.convertDevices.mock.test.json');
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
    const deviceGladysMock = devicesGladysMock.filter((device) => device.not_handled)[0];
    const deviceNetatmoMock = devicesNetatmoMock.filter((device) => device.type === 'NOC')[0];

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

  it('should correctly convert a Netatmo device without room', () => {
    const deviceGladysMock = devicesGladysMock.filter((device) => device.model === 'NOC')[0];
    deviceGladysMock.params = deviceGladysMock.params.filter(
      (param) => param.name !== 'room_name' && param.name !== 'room_id',
    );

    const deviceNetatmoMock = devicesNetatmoMock.filter((device) => device.type === 'NOC')[0];
    deviceNetatmoMock.room = undefined;

    const gladysDevice = netatmoHandler.convertDeviceNotSupported(deviceNetatmoMock);

    expect(gladysDevice).deep.equal(deviceGladysMock);
    expect(gladysDevice.features).deep.equal([]);
    expect(gladysDevice.params).deep.equal(deviceGladysMock.params);

    expect(gladysDevice).to.have.property('name', deviceGladysMock.name);
    expect(gladysDevice).to.have.property('external_id', `netatmo:${deviceNetatmoMock.id}`);
    expect(gladysDevice).to.have.property('model', 'NOC');

    const paramMock = gladysDevice.params.filter((param) => param.name === 'room_name')[0];
    expect(paramMock).to.equal(undefined);
  });
});
