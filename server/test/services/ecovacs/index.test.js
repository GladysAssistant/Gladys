const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;
const proxyquire = require('proxyquire').noCallThru();

function EcovacsHandler() {
  this.start = fake.returns(null);
  this.stop = fake.returns(null);
}

const EcovacsService = proxyquire('../../../services/ecovacs', {
  './lib': EcovacsHandler,
});

const gladys = {
  event: {
    emit: fake.returns(null),
  },
  variable: {
    getValue: () => 'value',
  },
};

describe('EcovacsService', () => {
  let ecovacsService;

  beforeEach(() => {
    ecovacsService = EcovacsService(gladys, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
  });

  afterEach(() => {
    sinon.reset();
  });

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
