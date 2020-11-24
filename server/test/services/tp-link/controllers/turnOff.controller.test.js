const { assert, fake } = require('sinon');
const TpLinkControllers = require('../../../../services/tp-link/api/tp-link.controller');

const tpLinkService = {
  setValue: fake.resolves(null),
};

const res = {
  json: fake.returns(null),
};

describe('POST /api/v1/service/tp-link/devices/:device_id/off', () => {
  it('should turn off device', async () => {
    const tpLinkController = TpLinkControllers(tpLinkService);
    await tpLinkController['post /api/v1/service/tp-link/devices/:device_id/off'].controller(
      { params: { device_id: 1 } },
      res,
    );
    assert.calledWith(tpLinkService.setValue, 1, 0);
  });
});
