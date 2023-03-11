const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');
const { event, serviceId, devices, variableOk } = require('../../consts.test');
const EcovacsApiMock = require('../../mocks/ecovacs-api.mock.test');
const { EcoVacsAPI, fakes } = require('../../mocks/ecovacs-api.mock.test');
const { NotFoundError } = require('../../../../../utils/coreErrors');

const { assert, fake } = sinon;

const vacbotMock = {
  did: '0ccdd884-b00f-4838-a50b-bf4fb3fc7a12',
  name: 'E0001278919601690356',
  deviceName: 'DEEBOT OZMO 920 Series',
  deviceNumber: 0,
  connect: fake.resolves(true),
  run: fake.resolves(true),
};

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
    assert.calledOnce(vacbotMock.run);
  });
});
