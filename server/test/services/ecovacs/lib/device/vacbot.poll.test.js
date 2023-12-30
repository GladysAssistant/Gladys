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
  service: {
    getByName: () => {
      return {
        status: 'STARTED',
      };
    },
  },
};

describe('Ecovacs : vacbot polling', () => {
  const ecovacsService = EcovacsService(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  it('should poll device', async () => {
    ecovacsService.device.vacbots.set(devices[0], fakes);
    await ecovacsService.device.poll(devices[0]);
    assert.calledWith(fakes.run, 'GetBatteryState');
    assert.calledWith(fakes.run, 'GetCleanState');
    assert.calledWith(fakes.run, 'GetChargeState');
    assert.calledWith(fakes.run, 'GetSleepStatus');
  });

  it('should poll device, handle errorCode 4200 and disconnect', async () => {
    fakes.errorCode = '4200'; // vacbot with errorCode 4200
    ecovacsService.device.vacbots.set(devices[0], fakes);
    await ecovacsService.device.poll(devices[0]);
  });

  it('should not poll device : it is not ready', async () => {
    fakes.is_ready = false; // vacbot not ready
    ecovacsService.device.vacbots.set(devices[0], fakes);
    await ecovacsService.device.poll(devices[0]);
    assert.notCalled(fakes.run);
  });
});
