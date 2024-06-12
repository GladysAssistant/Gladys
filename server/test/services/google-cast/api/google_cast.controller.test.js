const sinon = require('sinon');
const GoogleCastController = require('../../../../services/google-cast/api/google_cast.controller');

const { assert, fake } = sinon;

const googleCastHandler = {
  scan: fake.resolves([
    {
      name: 'my name',
    },
  ]),
};

describe('GoogleCastController GET /api/v1/service/google-cast/discover', () => {
  let controller;

  beforeEach(() => {
    controller = GoogleCastController(googleCastHandler);
    sinon.reset();
  });

  it('should return discovered devices', async () => {
    const req = {};
    const res = {
      json: fake.returns([]),
    };

    await controller['get /api/v1/service/google-cast/discover'].controller(req, res);
    assert.calledOnce(googleCastHandler.scan);
    assert.calledWith(res.json, [
      {
        name: 'my name',
      },
    ]);
  });
});
