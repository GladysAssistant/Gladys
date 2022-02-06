const { expect, assert } = require('chai');
const { fake } = require('sinon');
const WithingsHandler = require('../../../../services/withings/lib');
const { Error500 } = require('../../../../utils/httpErrors');

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

    try {
      await withingsHandler.deleteVar('req', undefined);
      assert.fail('should have Error500 error');
    } catch (e) {
      expect(e).to.be.instanceOf(Error500);
    }
  });
});
