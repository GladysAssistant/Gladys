const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');
const { event, serviceId, devices, variableOk } = require('../../consts.test');
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

describe('EcovacsHandler setValue', () => {
  const ecovacsService = EcovacsService(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
    ecovacsService.device.connected = false;
  });

  it('should set the binary value to 1', async () => {
    await ecovacsService.device.setValue(
      devices[0],
      { external_id: 'ecovacs:5c19a8f3a1e6ee0001782247:binary:0', category: 'vacbot', type: 'state' },
      1,
    );
    assert.calledOnce(fakes.clean);
    assert.notCalled(fakes.stop);
  });

  it('should set the binary value to 0', async () => {
    await ecovacsService.device.setValue(
      devices[0],
      { external_id: 'ecovacs:5c19a8f3a1e6ee0001782247:binary:0', category: 'vacbot', type: 'state' },
      0,
    );
    assert.calledOnce(fakes.pause);
    assert.notCalled(fakes.clean);
    assert.notCalled(fakes.stop);
  });

  it('should set the binary value to -1', async () => {
    await ecovacsService.device.setValue(
      devices[0],
      { external_id: 'ecovacs:5c19a8f3a1e6ee0001782247:binary:0', category: 'vacbot', type: 'state' },
      -1,
    );
    assert.calledOnce(fakes.stop);
    assert.notCalled(fakes.clean);
    assert.notCalled(fakes.pause);
  });

  it('should set the binary value is not handled', async () => {
    await ecovacsService.device.setValue(
      devices[0],
      { external_id: 'ecovacs:5c19a8f3a1e6ee0001782247:binary:0', category: 'vacbot', type: 'state' },
      null,
    );
    assert.notCalled(fakes.stop);
    assert.notCalled(fakes.clean);
    assert.notCalled(fakes.pause);
  });

  it('should raise an error', async () => {
    EcoVacsAPI.prototype.getVacBot = fake.returns(null);

    try {
      await ecovacsService.device.setValue(
        devices[0],
        { external_id: 'ecovacs:5c19a8f3a1e6ee0001782247:binary:0', category: 'vacbot', type: 'state' },
        0,
      );
      assert.fail('Should have fail');
    } catch (e) {
      expect(e).is.instanceOf(NotFoundError);
      assert.notCalled(fakes.stop);
      assert.notCalled(fakes.clean);
    }
  });
});
