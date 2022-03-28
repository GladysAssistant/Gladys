const { expect } = require('chai');
const { fake } = require('sinon');
const WithingsHandler = require('../../../../services/withings/lib');

const gladysOk = {
  variable: {
    getValue: fake.resolves(null),
    setValue: fake.resolves(null),
    destroy: fake.resolves(null),
  },
  oauth2Client: {
    deleteClient: fake.resolves({ success: true }),
  },
};

describe('WithingsHandler deleteVar', () => {
  it('deletes oauth2 vars', async () => {
    const withingsHandler = new WithingsHandler(gladysOk, null);

    const result = await withingsHandler.deleteVar('req');
    expect(result).to.eql({ success: true });
  });
});
