---
to: test/services/<%= module %>/lib/commands/<%= module %>.getStatus.test.js
---
const { expect } = require('chai');
const sinon = require('sinon');
const <%= className %>Service = require('../../../../../services/<%= module %>');
const { event, serviceId } = require('../../mocks/consts.test');

describe('<%= module %>.status command', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should get service status', () => {
    const gladys = { event };
    const <%= attributeName %>Service = <%= className %>Service(gladys, serviceId);
    const result = <%= attributeName %>Service.device.getStatus();
    // TODO : complete
    expect(result).deep.eq(null);
  });

});
