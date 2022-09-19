const { expect } = require('chai');
const sinon = require('sinon');

const { assert } = sinon;
const proxyquire = require('proxyquire').noCallThru();
const { EcovacsHandlerMock } = require('./mocks/ecovacs.mock.test');

const EcovacsService = proxyquire('../../../services/ecovacs', {
  './lib': EcovacsHandlerMock,
});

describe('EcovacsService', () => {
  const ecovacsService = EcovacsService({}, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');

  it('should have controllers', () => {
    expect(ecovacsService)
      .to.have.property('controllers')
      .and.be.instanceOf(Object);
  });

  it('should start service', async () => {
    await ecovacsService.start();
    assert.calledOnce(ecovacsService.device.start);
  });

  it('should stop service', async () => {
    await ecovacsService.stop();
    assert.calledOnce(ecovacsService.device.stop);
  });
});
