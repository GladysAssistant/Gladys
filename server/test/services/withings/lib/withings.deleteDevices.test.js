const { fake, assert } = require('sinon');

const WithingsHandler = require('../../../../services/withings/lib');

const gladys = {
  device: { destroyByServiceId: fake.returns(null) },
};

describe('WithingsHandler deleteDevices', () => {
  const withingsHandler = new WithingsHandler(gladys, null, null, null);

  it('delete devices', async () => {
    await withingsHandler.deleteDevices();
    assert.calledWith(gladys.device.destroyByServiceId, withingsHandler.serviceId);
  });
});
