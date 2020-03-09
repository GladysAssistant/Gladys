const { expect } = require('chai');

const models = require('../../../../services/sonoff/models');

describe('SonoffService - unknown model', () => {
  it('get model for unkown device', () => {
    const params = models[-1];

    expect(params).to.eq(undefined);
  });
});
