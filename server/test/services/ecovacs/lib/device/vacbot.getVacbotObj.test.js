const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');

const { assert, fake } = sinon;

const { event, serviceId, devices, vacbotMock, variableOk } = require('../../consts.test');

const EcovacsApiMock = require('../../mocks/ecovacs-api.mock.test');

const ecovacsConnectMock = fake.resolves(true);

const EcovacsHandler = proxyquire('../../../../../services/ecovacs/lib', {
  './commands/ecovacs.connect.js': { connect: ecovacsConnectMock },
});

const EcovacsService = proxyquire('../../../../../services/ecovacs/index', {
  'ecovacs-deebot': EcovacsApiMock,
  './lib': EcovacsHandler,
});

const gladys = {
  variable: variableOk,
  event,
};

describe('Ecovacs : vacbot status', () => {
  const ecovacsService = EcovacsService(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
    ecovacsService.device.ecovacsClient = new EcovacsApiMock.EcoVacsAPI();
    ecovacsService.device.connected = false;
    ecovacsService.device.vacbots.set(devices[0], vacbotMock);
  });

  it('should return a vacbot object from a gladys device', async () => {
    const externalId = devices[0].external_id;
    const obj = await ecovacsService.device.getVacbotObj(externalId);
    const expected = 'DEEBOT OZMO 920 Series';
    expect(obj.getName()).to.deep.equal(expected);
    assert.calledOnce(ecovacsService.device.connect);
  });
});
