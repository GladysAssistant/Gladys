const sinon = require('sinon');

const { assert } = sinon;
const proxyquire = require('proxyquire').noCallThru();
const { event, serviceId, devices } = require('../../consts.test');
const EcovacsApiMock = require('../../mocks/ecovacs-api.mock.test');
const { fakes } = require('../../mocks/ecovacs-api.mock.test');

const EcovacsService = proxyquire('../../../../../services/ecovacs/index', {
  'ecovacs-deebot': EcovacsApiMock,
});

describe('ecovacs.listen command', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should connect to unready vacbot (mqtt) and listen to events', async () => {
    const gladys = { event };
    fakes.is_ready = false;
    const ecovacsService = EcovacsService(gladys, serviceId);
    ecovacsService.device.listen(fakes, devices[0]);
    assert.calledOnce(fakes.connect);
    assert.calledTwice(fakes.on);
  });

  it('should listen to ready vacbot (mqtt) events', async () => {
    const gladys = { event };
    fakes.is_ready = true;
    const ecovacsService = EcovacsService(gladys, serviceId);
    ecovacsService.device.listen(fakes, devices[0]);
    assert.notCalled(fakes.connect);
    assert.calledTwice(fakes.on);
  });
});
