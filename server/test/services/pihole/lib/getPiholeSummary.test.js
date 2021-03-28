const sinon = require('sinon');

const { assert, fake } = sinon;

const PiholeHandler = require('../../../../services/pihole/lib');

const serviceId = 'faea9c35-759a-44d5-bcc9-2af1de37b842';

const gladys = {
  variable: {
    getValue: fake.resolves('result'),
  },
};

describe('piholeHandler.getPiholeSummary', () => {
  it('should get stock exchange index quote', async () => {
    const piholeHandler = new PiholeHandler(gladys, serviceId);
    await piholeHandler.getPiholeSummary();
    assert.callCount(gladys.variable.getValue, 2);
  });
});
