const { expect } = require('chai');

const models = require('../../../../services/tasmota/models');

describe('TasmotaService - unknown model', () => {
  it('get model for unkown device', () => {
    const params = models[-1];

    expect(params).to.eq(undefined);
  });
});
