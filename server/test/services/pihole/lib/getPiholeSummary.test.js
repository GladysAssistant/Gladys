const sinon = require('sinon');

const { assert, fake } = sinon;

const proxyquire = require('proxyquire').noCallThru();

const MockedClient = require('./../mocks.test');

const PiholeHandler = proxyquire('../../../../services/pihole/lib', {
  axios: MockedClient,
});

const serviceId = 'faea9c35-759a-44d5-bcc9-2af1de37b842';

const gladys = {
  variable: {
    getValue: fake.resolves('fake'),
  },
};

describe('Pihole Service', () => {
  it('should get pihole summary data', async () => {
    const piholeHandler = new PiholeHandler(gladys, serviceId);
    await piholeHandler.getPiholeSummary();
    assert.callCount(gladys.variable.getValue, 1);
  });
});
