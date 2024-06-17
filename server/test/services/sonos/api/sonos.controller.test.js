const sinon = require('sinon');
const SonosController = require('../../../../services/sonos/api/sonos.controller');

const { assert, fake } = sinon;

const sonosHandler = {
  scan: fake.resolves([
    {
      host: '192.168.1.1',
    },
  ]),
};

describe('SonosController GET /api/v1/service/sonos/discover', () => {
  let controller;

  beforeEach(() => {
    controller = SonosController(sonosHandler);
    sinon.reset();
  });

  it('should return discovered devices', async () => {
    const req = {};
    const res = {
      json: fake.returns([]),
    };

    await controller['get /api/v1/service/sonos/discover'].controller(req, res);
    assert.calledOnce(sonosHandler.scan);
    assert.calledWith(res.json, [
      {
        host: '192.168.1.1',
      },
    ]);
  });
});
