const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');

const { event, serviceId, devices, vacbotMock, variableOk } = require('../../consts.test');

const EcovacsApiMock = require('../../mocks/ecovacs-api.mock.test');

const EcovacsService = proxyquire('../../../../../services/ecovacs/index', {
  'ecovacs-deebot': EcovacsApiMock,
});

const gladys = {
  variable: variableOk,
  event,
};

describe('Ecovacs : vacbot status', () => {
  const ecovacsService = EcovacsService(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
    ecovacsService.device.connected = false;
    ecovacsService.device.vacbots.set(devices[0], vacbotMock);
  });

  it('should return status of a device', async () => {
    const externalId = devices[0].external_id;
    const status = await ecovacsService.device.getDeviceStatus(externalId);
    const expected = {
      name: 'DEEBOT OZMO 920 Series',
      model: 'Ecovacs',
      imageUrl: 'http://image.url',
      mainBrush: true,
      hasMappingCapabilities: true,
      hasCustomAreaCleaningMode: true,
      hasMoppingSystem: true,
      chargeStatus: 'idle',
      cleanReport: 'idle',
      batteryLevel: 100,
      isOnline: true,
    };
    expect(status).to.deep.equal(expected);
  });
});
