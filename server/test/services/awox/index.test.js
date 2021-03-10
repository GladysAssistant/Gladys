const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const AwoxService = require('../../../services/awox');

const bluetooth = {
  device: 'bluetooth_device',
};
const gladys = {
  service: {
    getService: fake.returns(bluetooth),
  },
};
const serviceId = '9811285e-9f26-4af3-a291-3c3e6b9c7e04';

describe('AwoxService', () => {
  let service;

  beforeEach(() => {
    service = AwoxService(gladys, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should start service', async () => {
    await service.start();

    assert.calledWith(gladys.service.getService, 'bluetooth');
    expect(service.device.bluetooth).is.eq('bluetooth_device');
  });

  it('should stop service', async () => {
    service.device.bluetooth = bluetooth;

    await service.stop();

    expect(service.device.bluetooth).is.eq(undefined);
  });
});
