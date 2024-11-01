const sinon = require('sinon');
const AirplayController = require('../../../../services/airplay/api/airplay.controller');

const { assert, fake } = sinon;

const airplayHandler = {
  scan: fake.resolves([
    {
      name: 'my name',
    },
  ]),
};

describe('AirplayController GET /api/v1/service/airplay/discover', () => {
  let controller;

  beforeEach(() => {
    controller = AirplayController(airplayHandler);
    sinon.reset();
  });

  it('should return discovered devices', async () => {
    const req = {};
    const res = {
      json: fake.returns([]),
    };

    await controller['get /api/v1/service/airplay/discover'].controller(req, res);
    assert.calledOnce(airplayHandler.scan);
    assert.calledWith(res.json, [
      {
        name: 'my name',
      },
    ]);
  });
});
