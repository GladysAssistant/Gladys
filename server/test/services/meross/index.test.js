const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const MockedClient = require('./mocks.test');
const { setDeviceParam } = require('../../../utils/setDeviceParam');

const MerossService = proxyquire('../../../services/meross/index', {
  axios: MockedClient,
});

describe('MerossService', () => {
  const service = MerossService();
  it('should have start function', () => {
    expect(service)
      .to.have.property('start')
      .and.be.instanceOf(Function);
  });
  it('should have stop function', () => {
    expect(service)
      .to.have.property('stop')
      .and.be.instanceOf(Function);
  });
  it('should have device object', () => {
    expect(service)
      .to.have.property('device')
      .and.be.instanceOf(Object);
  });
  it('service.device should have turnOn function', () => {
    expect(service.device)
      .to.have.property('turnOn')
      .and.be.instanceOf(Function);
  });
  it('service.device should have turnOff function', () => {
    expect(service.device)
      .to.have.property('turnOff')
      .and.be.instanceOf(Function);
  });
});

describe('MerossService lifecycle', () => {
  const service = MerossService();
  it('should start the service', async () => {
    await service.start();
  });
  it('should stop the service', async () => {
    await service.stop();
  });
});

describe('MerossService.device', () => {
  const service = MerossService();

  const device = {};
  setDeviceParam(device, 'CAMERA_URL', 'http://localhost');

  const deviceFeature = {
    id: 'd0a6cfc7-fe07-4df1-b0db-70d878bcdd2b',
    external_id: 'example:1',
    type: 'binary',
  };
  
  it('should turnOn the device', async () => {
    await service.device.turnOn(device, deviceFeature);
  });
  it('should turnOff the device', async () => {
    await service.device.turnOff(device, deviceFeature);
  });
});
