const { expect } = require('chai');
const sinon = require('sinon');

const { assert } = sinon;
const proxyquire = require('proxyquire').noCallThru();
const { NukiHandlerMock } = require('./mocks/nuki.mock.test');
const { serviceId } = require('./mocks/consts.test');

const NukiService = proxyquire('../../../services/nuki', {
  './lib': NukiHandlerMock,
});

describe('NukiService', () => {
  const nukiService = NukiService({}, serviceId);

  it('should have controllers', () => {
    expect(nukiService)
      .to.have.property('controllers')
      .and.be.instanceOf(Object);
  });

  it('should start service', async () => {
    await nukiService.start();
    assert.calledOnce(nukiService.device.start);
  });

  it('should stop service', async () => {
    await nukiService.stop();
    assert.calledOnce(nukiService.device.stop);
  });
});
