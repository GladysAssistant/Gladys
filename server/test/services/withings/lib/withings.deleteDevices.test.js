const { fake, assert } = require('sinon');

const WithingsHandler = require('../../../../services/withings/lib');

const gladys = {
  variable: {
    getValue: fake.resolves(null),
    setValue: fake.resolves(null),
  },
  device: { destroyByServiceId: fake.returns(null) },
};

describe('WithingsHandler deleteDevices', () => {
  const withingsHandler = new WithingsHandler(gladys, null);

  it('delete devices', async () => {
    await withingsHandler.deleteDevices();
    assert.calledWith(gladys.device.destroyByServiceId, withingsHandler.serviceId);
  });
});
