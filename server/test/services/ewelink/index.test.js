const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const EwelinkApi = require('./lib/ewelink-api.mock.test');
const { SERVICE_ID } = require('./lib/constants');

const { fake, assert } = sinon;

const EweLinkHandlerMock = sinon.stub();
EweLinkHandlerMock.prototype.init = fake.returns(null);

const EweLinkService = proxyquire('../../../services/ewelink/index', {
  './lib': EweLinkHandlerMock,
  'ewelink-api-next': EwelinkApi,
});

const gladys = {};

describe('EweLinkService', () => {
  const eweLinkService = EweLinkService(gladys, SERVICE_ID);

  afterEach(() => {
    sinon.reset();
  });

  it('should have controllers', () => {
    expect(eweLinkService)
      .to.have.property('controllers')
      .and.be.instanceOf(Object);
  });
  it('should start service', async () => {
    await eweLinkService.start();
    assert.calledOnceWithExactly(eweLinkService.device.init);
  });
  it('should stop service', async () => {
    await eweLinkService.stop();
    assert.notCalled(eweLinkService.device.init);
  });
});
