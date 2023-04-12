const { expect } = require('chai');
const { fake, assert } = require('sinon');

const EnedisController = require('../../../services/enedis/api/enedis.controller');

describe('EnedisController', () => {
  it('should sync enedis', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };
    const enedisService = {
      sync: fake.resolves({}),
    };
    const ecowattController = EnedisController(enedisService);
    await ecowattController['post /api/v1/service/enedis/sync'].controller(req, res);
    assert.calledOnce(enedisService.sync);
    expect(res.json.firstCall.lastArg).to.deep.equal({
      success: true,
    });
  });
});
