const sinon = require('sinon');

const { assert, fake } = sinon;
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const { event, serviceId, devices } = require('../../consts.test');
const EcovacsApiMock = require('../../mocks/ecovacs-api.mock.test');

const vacbotMock = {
  did: '0ccdd884-b00f-4838-a50b-bf4fb3fc7a12',
  name: 'E0001278919601690356',
  deviceName: 'DEEBOT OZMO 920 Series',
  deviceNumber: 0,
  is_ready: true,
  connect: fake.resolves(true),
  on: fake.resolves(true),
};


const EcovacsService = proxyquire('../../../../../services/ecovacs/index', {
  'ecovacs-deebot': EcovacsApiMock,
});

describe('ecovacs.listen command', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should listen to vacbot events', async () => {
    const gladys = { event };
    const ecovacsService = EcovacsService(gladys, serviceId);
    ecovacsService.device.listen(vacbotMock, devices[0]);
    assert.calledTwice(vacbotMock.on);
  });
});
