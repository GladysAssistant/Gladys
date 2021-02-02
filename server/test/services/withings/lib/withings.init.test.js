const { expect } = require('chai');
const { fake } = require('sinon');
const WithingsHandler = require('../../../../services/withings/lib');

const gladys = {
  device: { create: fake.resolves(null) },
  variable: { getValue: fake.resolves(null), setValue: fake.resolves(null) },
};

describe('WithingsHandler init', () => {
  it('init devices in Gladys', async () => {
    const withingsHandler = new WithingsHandler(gladys, null, null, null);

    const result = await withingsHandler.init('0cd30aef-9c4e-4a23-88e3-3547971296e5');
    expect(result).to.eql({ success: true });
  });
});
