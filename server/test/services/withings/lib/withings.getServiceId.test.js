const { expect } = require('chai');
const WithingsHandler = require('../../../../services/withings/lib');

describe('WithingsHandler getServiceId', () => {
  const withingsHandler = new WithingsHandler(null, '55f177d7-bc35-4560-a1f0-4c58b9e9f2c4', null, null);

  it('returns serviceId', () => {
    const result = withingsHandler.getServiceId();
    expect(result).to.eql({ success: true, serviceId: '55f177d7-bc35-4560-a1f0-4c58b9e9f2c4' });
  });
});
