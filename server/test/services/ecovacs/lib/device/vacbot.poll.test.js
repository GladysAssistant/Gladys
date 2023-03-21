const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');
const { event, serviceId, devices, vacbotMock, variableOk } = require('../../consts.test');
const EcovacsApiMock = require('../../mocks/ecovacs-api.mock.test');
const { EcoVacsAPI, fakes } = require('../../mocks/ecovacs-api.mock.test');
const { NotFoundError } = require('../../../../../utils/coreErrors');

const { assert, fake } = sinon;


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
    ecovacsService.device.vacbots.set(devices[0], vacbotMock);
  });

  it('should poll device', async () => {
    await ecovacsService.device.poll(devices[0]);
    assert.calledWith(vacbotMock.run, 'GetBatteryState');
    assert.calledWith(vacbotMock.run, 'GetCleanState');
    assert.calledWith(vacbotMock.run, 'GetChargeState');
    assert.calledWith(vacbotMock.run, 'GetSleepStatus'); 
  });
});
