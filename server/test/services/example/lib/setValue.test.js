const { expect } = require('chai');

const ExampleService = require('../../../../services/example/lib/light');

const gladys = {};
const serviceId = '264d191c-dae2-4893-bf35-3c7fee3cc262';

describe('example setValue', () => {
  let service;

  beforeEach(() => {
    service = new ExampleService(gladys, serviceId);
  });

  it('should return arg value', async () => {
    const result = await service.setValue(null, null, 'value');
    expect(result).to.equal('value');
  });
});
