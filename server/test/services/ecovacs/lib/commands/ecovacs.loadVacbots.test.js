const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');
const { serviceId, devices } = require('../../consts.test');

const { assert, fake } = sinon;
const ecovacsGetVacbotObjMock = fake.resolves({
  did: '0ccdd884-b00f-4838-a50b-bf4fb3fc7a12',
  name: 'E0001278919601690356',
  deviceName: 'DEEBOT OZMO 920 Series',
  deviceNumber: 0,
  connect: fake.resolves(true),
  on: fake.resolves(true),
});
const ecovacsListenMock = fake.returns(true);

const EcovacsHandler = proxyquire('../../../../../services/ecovacs/lib', {
  './device/vacbot.getVacbotObj.js': { getVacbotObj: ecovacsGetVacbotObjMock },
  './commands/ecovacs.listen.js': { listen: ecovacsListenMock },
});
const EcovacsService = proxyquire('../../../../../services/ecovacs', {
  './lib': EcovacsHandler,
});

describe('ecovacs.loadVacbots command', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should load in controller all registered vacbots', async () => {
    const gladys = { device: { get: fake.resolves(devices) } };
    const ecovacsService = EcovacsService(gladys, serviceId);
    await ecovacsService.device.loadVacbots();
    assert.calledThrice(ecovacsService.device.getVacbotObj);
    assert.calledThrice(ecovacsService.device.listen);
    expect(ecovacsService.device.vacbots.size).to.equal(3);
  });
});
