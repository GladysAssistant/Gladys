const { expect } = require('chai');
const { fake } = require('sinon');
const WithingsHandler = require('../../../../services/withings/lib');

const gladysOk = {
  variable: { setValue: fake.resolves(null) },
};

const gladysKo = {
  variable: { setValue: fake.rejects('Fail to save') },
};

describe('WithingsHandler saveVar', () => {
  it('saves oauth2 vars', async () => {
    const withingsHandler = new WithingsHandler(gladysOk, '55f177d7-bc35-4560-a1f0-4c58b9e9f2c4', null, null);

    const result = await withingsHandler.saveVar('789dsfds452fsdq27fze2ds', 'fdsf847f5re3f92d1', 'test', null);
    expect(result).to.eql({ success: true, serviceId: '55f177d7-bc35-4560-a1f0-4c58b9e9f2c4' });
  });
  it('fails to save oauth2 vars', async () => {
    const withingsHandler = new WithingsHandler(gladysKo, '55f177d7-bc35-4560-a1f0-4c58b9e9f2c4', null, null);

    const result = await withingsHandler.saveVar('789dsfds452fsdq27fze2ds', 'fdsf847f5re3f92d1', 'test', null);
    expect(result).to.eql({ success: false, errorMsg: 'Fail to save' });
  });
});
