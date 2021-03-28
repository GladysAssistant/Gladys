const { assert, fake, stub } = require('sinon');
const PiholeController = require('../../../services/pihole/api/pihole.controller');

const userId = '3ebd27cb-42cf-4b32-a33c-135af7d62a37';

const piholeService = {
  getPiholeSummary: stub(),
};

const res = {
  json: fake.returns(null),
  status: fake.returns({
    send: fake.returns(null),
  }),
};

describe('get /api/v1/pihole/getPiholeSummary', () => {
  it('should return an array', async () => {
    const piholeController = PiholeController(piholeService);
    await piholeController['get /api/v1/pihole/getPiholeSummary'].controller(res);
    assert.calledWith(piholeService.getPiholeSummary, userId);
  });
});
