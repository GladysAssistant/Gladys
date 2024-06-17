const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const { event, serviceId } = require('../../consts.test');
const EcovacsApiMock = require('../../mocks/ecovacs-api.mock.test');

const EcovacsService = proxyquire('../../../../../services/ecovacs/index', {
  'ecovacs-deebot': EcovacsApiMock,
});

describe('ecovacs.getStatus command', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should get service status', async () => {
    const gladys = { event };
    const ecovacsService = EcovacsService(gladys, serviceId);
    const result = await ecovacsService.device.getStatus();
    expect(result).deep.eq({ connected: false, configured: false });
  });
});
