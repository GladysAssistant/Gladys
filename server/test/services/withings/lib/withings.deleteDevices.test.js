const { expect } = require('chai');
const { fake } = require('sinon');
const WithingsHandler = require('../../../../services/withings/lib');

const gladys = {
  device: { destroyBySelectorPattern: fake.returns(null) },
};

describe('WithingsHandler deleteDevices', () => {
  const withingsHandler = new WithingsHandler(gladys, null, null, null);

  it('delete devices', async () => {
    const result = await withingsHandler.deleteDevices();
    expect(result).to.eql({ success: true });
  });
});
