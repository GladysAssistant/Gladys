const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');

const {
  event,
  serviceId,
  devices,
  variableOk,
  stateManagerWith0Devices,
  stateManagerWith2Devices,
} = require('../../consts.test');

const EcovacsApiMock = require('../../mocks/ecovacs-api.mock.test');

const EcovacsService = proxyquire('../../../../../services/ecovacs/index', {
  'ecovacs-deebot': EcovacsApiMock,
});
const EcovacsApiEmptyMock = require('../../mocks/ecovacs-api-empty.mock.test');

const EcovacsServiceEmpty = proxyquire('../../../../../services/ecovacs/index', {
  'ecovacs-deebot': EcovacsApiEmptyMock,
});

const gladysWith0Devices = {
  variable: variableOk,
  event,
  stateManager: stateManagerWith0Devices,
};
const gladysWith2Devices = {
  variable: variableOk,
  event,
  stateManager: stateManagerWith2Devices,
};

describe('Ecovacs : vacbot discovering', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should found 0 devices', async () => {
    const ecovacsService = EcovacsServiceEmpty(gladysWith0Devices, serviceId);
    ecovacsService.device.connected = false;
    const newDevices = await ecovacsService.device.discover();
    expect(newDevices).to.have.deep.members([]);
  });
  it('should found 2 new devices', async () => {
    const ecovacsService = EcovacsService(gladysWith0Devices, serviceId);
    ecovacsService.device.connected = false;
    const newDevices = await ecovacsService.device.discover();
    expect(newDevices.length).to.equal(3);
    expect(newDevices).to.have.deep.members(devices);
  });
  it('should found 3 devices, 2 of these are already in Gladys and 1 is a new unknown device', async () => {
    const ecovacsService = EcovacsService(gladysWith2Devices, serviceId);
    ecovacsService.device.connected = false;
    const newDevices = await ecovacsService.device.discover();
    expect(newDevices.length).to.equal(1);
    expect(newDevices).to.have.deep.members([devices[2]]);
  });
});
