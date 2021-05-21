const { expect } = require('chai');
const { fake } = require('sinon');
const WithingsHandler = require('../../../../services/withings/lib');

const gladysOk = {
  variable: { destroy: fake.resolves(null) },
};

const gladysKo = {
  variable: { destroy: fake.rejects('Fail to delete') },
};

describe('WithingsHandler deleteVar', () => {
  it('deletes oauth2 vars', async () => {
    const withingsHandler = new WithingsHandler(gladysOk, null, null, null);

    const result = await withingsHandler.deleteVar('req', undefined);
    expect(result).to.eql({ success: true });
  });
  it('fails to delete oauth2 vars', async () => {
    const withingsHandler = new WithingsHandler(gladysKo, null, null, null);

    const result = await withingsHandler.deleteVar('req', undefined);
    expect(result).to.eql({ success: false, errorMsg: 'Fail to delete' });
  });
});
