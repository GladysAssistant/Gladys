---
to: test/services/<%= module %>/index.test.js
---
const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;
const proxyquire = require('proxyquire').noCallThru();
const { <%= className %>HandlerMock } = require('./mocks/<%= module %>.mock.test');

function <%= className %>Handler() {
  this.start = fake.returns(null);
  this.stop = fake.returns(null);
}

const <%= className %>Service = proxyquire('../../../services/<%= module %>', {
  './lib': <%= className %>HandlerMock,
});

const gladys = {
  event: {
    emit: fake.returns(null),
  },
  device: {
    get: () => [],
  },
  variable: {
    getValue: () => 'value',
  },
};

describe('<%= className %>Service', () => {
  const <%= attributeName %>Service = <%= className %>Service({}, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');

  it('should have controllers', () => {
      expect(<%= attributeName %>Service)
        .to.have.property('controllers')
        .and.be.instanceOf(Object);
  });

  it('should start service', async () => {
    await <%= attributeName %>Service.start();
    assert.calledOnce(<%= attributeName %>Service.device.start);
  });

  it('should stop service', async () => {
    await <%= attributeName %>Service.stop();
    assert.calledOnce(<%= attributeName %>Service.device.stop);
  });
});
