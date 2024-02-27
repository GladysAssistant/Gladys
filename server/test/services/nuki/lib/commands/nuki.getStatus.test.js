const { expect } = require('chai');
const sinon = require('sinon');
const NukiService = require('../../../../../services/nuki');
const { event, serviceId } = require('../../mocks/consts.test');

describe('nuki.status command', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should get service status', () => {
    const gladys = { event };
    const nukiService = NukiService(gladys, serviceId);
    const result = nukiService.device.getStatus();
    // TODO : complete
    expect(result).deep.eq(null);
  });
});
