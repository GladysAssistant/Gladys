const { expect } = require('chai');

const Service = require('../../../lib/service');

describe('service.getLocalServiceByName', () => {
  const service = new Service();
  it('should return test-service', async () => {
    const result = await service.getLocalServiceByName('test-service');
    expect(result).to.have.property('name', 'test-service');
    expect(result).to.have.property('id', 'a810b8db-6d04-4697-bed3-c4b72c996279');
  });
});
