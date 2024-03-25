const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');
const { serviceId, devices } = require('../../consts.test');
const { fakes } = require('../../mocks/ecovacs-api.mock.test');

const { assert, fake } = sinon;
const ecovacsGetVacbotObjMock = fake.resolves(fakes);

const EcovacsHandler = proxyquire('../../../../../services/ecovacs/lib', {
  './device/vacbot.getVacbotObj.js': { getVacbotObj: ecovacsGetVacbotObjMock },
});
const EcovacsService = proxyquire('../../../../../services/ecovacs', {
  './lib': EcovacsHandler,
});

const gladys = {
  device: {
    get: fake.resolves(devices), // 3 registered devices
  },
};

describe('ecovacs.stop command', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('check listeners and peripherals are well removed', async () => {
    const ecovacsService = EcovacsService(gladys, serviceId);
    await ecovacsService.device.stop();
    // call disconnect for all registered devices
    assert.calledThrice(fakes.disconnect);
  });
});
