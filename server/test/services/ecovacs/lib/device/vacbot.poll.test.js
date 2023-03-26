const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');
const { event, serviceId, devices, variableOk } = require('../../consts.test');
const EcovacsApiMock = require('../../mocks/ecovacs-api.mock.test');
const { fakes } = require('../../mocks/ecovacs-api.mock.test');

const { assert } = sinon;

const EcovacsService = proxyquire('../../../../../services/ecovacs/index', {
  'ecovacs-deebot': EcovacsApiMock,
});

const gladys = {
  event,
  variable: variableOk,
};

describe('Ecovacs : vacbot polling', () => {
  const ecovacsService = EcovacsService(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
    ecovacsService.device.vacbots.set(devices[0], fakes);
  });

  it('should poll device', async () => {
    await ecovacsService.device.poll(devices[0]);
    assert.calledWith(fakes.run, 'GetBatteryState');
    assert.calledWith(fakes.run, 'GetCleanState');
    assert.calledWith(fakes.run, 'GetChargeState');
    assert.calledWith(fakes.run, 'GetSleepStatus');
  });
});
