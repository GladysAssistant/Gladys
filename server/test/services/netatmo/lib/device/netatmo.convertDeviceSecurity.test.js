const { expect } = require('chai');
const sinon = require('sinon');

const { SUPPORTED_MODULE_TYPE } = require('../../../../../services/netatmo/lib/utils/netatmo.constants');
const NetatmoHandler = require('../../../../../services/netatmo/lib/index');

const gladys = {};
const serviceId = 'serviceId';
const netatmoHandler = new NetatmoHandler(gladys, serviceId);

const deviceNetatmoNACameraMock = {
  id: '70:ee:50:aa:bb:cc',
  type: 'NACamera',
  name: 'Camera Hall',
  home: '5e1xxxxxxxxxxxxxxxxx',
  modules_bridged: ['12:34:56:aa:bb:cc'],
  monitoring: 'on',
  wifi_strength: 60,
  room: {
    id: '1234567890',
    name: 'Hall',
  },
};

const deviceNetatmoNOCMock = {
  id: '70:ee:50:dd:ee:ff',
  type: 'NOC',
  module_name: 'Outdoor Camera',
  home_id: '5e1xxxxxxxxxxxxxxxxx',
  monitoring: 'off',
  wifi_strength: 55,
};

describe('Netatmo Convert Security Device', () => {
  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should correctly convert a Netatmo Indoor Camera NACamera device', () => {
    const gladysDevice = netatmoHandler.convertDeviceSecurity(deviceNetatmoNACameraMock);

    expect(gladysDevice).to.have.property('name', 'Camera Hall');
    expect(gladysDevice).to.have.property('external_id', `netatmo:${deviceNetatmoNACameraMock.id}`);
    expect(gladysDevice).to.have.property('model', SUPPORTED_MODULE_TYPE.NACAMERA);
    expect(gladysDevice).to.have.property('service_id', serviceId);
    expect(gladysDevice.not_handled).to.equal(undefined);

    expect(gladysDevice.features).to.have.lengthOf(3);
    const wifiFeature = gladysDevice.features.find(
      (feature) => feature.external_id === `netatmo:${deviceNetatmoNACameraMock.id}:wifi_strength`,
    );
    expect(wifiFeature).to.not.equal(undefined);
    const monitoringFeature = gladysDevice.features.find(
      (feature) => feature.external_id === `netatmo:${deviceNetatmoNACameraMock.id}:monitoring`,
    );
    expect(monitoringFeature).to.not.equal(undefined);
    expect(monitoringFeature.read_only).to.equal(false);
    const cameraFeature = gladysDevice.features.find(
      (feature) => feature.external_id === `netatmo:${deviceNetatmoNACameraMock.id}:camera`,
    );
    expect(cameraFeature).to.not.equal(undefined);
    expect(cameraFeature.category).to.equal('camera');
    expect(cameraFeature.keep_history).to.equal(false);

    const bridgeParam = gladysDevice.params.find((param) => param.name === 'modules_bridge_id');
    expect(bridgeParam).to.have.property('value', JSON.stringify(deviceNetatmoNACameraMock.modules_bridged));
    const homeParam = gladysDevice.params.find((param) => param.name === 'home_id');
    expect(homeParam).to.have.property('value', deviceNetatmoNACameraMock.home);
    const roomNameParam = gladysDevice.params.find((param) => param.name === 'room_name');
    expect(roomNameParam).to.have.property('value', 'Hall');
  });

  it('should correctly convert a Netatmo Outdoor Camera NOC device without room', () => {
    const gladysDevice = netatmoHandler.convertDeviceSecurity(deviceNetatmoNOCMock);

    expect(gladysDevice).to.have.property('name', 'Outdoor Camera');
    expect(gladysDevice).to.have.property('external_id', `netatmo:${deviceNetatmoNOCMock.id}`);
    expect(gladysDevice).to.have.property('model', SUPPORTED_MODULE_TYPE.NOC);

    expect(gladysDevice.features).to.have.lengthOf(3);
    const bridgeParam = gladysDevice.params.find((param) => param.name === 'modules_bridge_id');
    expect(bridgeParam).to.have.property('value', '[]');
    const homeParam = gladysDevice.params.find((param) => param.name === 'home_id');
    expect(homeParam).to.have.property('value', deviceNetatmoNOCMock.home_id);
    const roomNameParam = gladysDevice.params.find((param) => param.name === 'room_name');
    expect(roomNameParam).to.equal(undefined);
  });

  it('should keep the not_handled flag and fall back to station_name', () => {
    const deviceNetatmoMock = {
      _id: '70:ee:50:11:22:33',
      type: 'NACamera',
      station_name: 'Camera Salon',
      home_id: '5e1xxxxxxxxxxxxxxxxx',
      not_handled: true,
    };

    const gladysDevice = netatmoHandler.convertDeviceSecurity(deviceNetatmoMock);

    expect(gladysDevice).to.have.property('name', 'Camera Salon');
    expect(gladysDevice).to.have.property('external_id', `netatmo:${deviceNetatmoMock._id}`);
    expect(gladysDevice.not_handled).to.equal(true);
  });
});
