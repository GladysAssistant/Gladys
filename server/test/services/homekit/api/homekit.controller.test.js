const sinon = require('sinon').createSandbox();
const HomeKitController = require('../../../../services/homekit/api/homekit.controller');

const { assert, fake } = sinon;

const homekitHandler = {
  getCompatibleDevices: fake.resolves([
    {
      id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Lampe salon',
      selector: 'lampe-salon',
      features: [],
    },
    {
      id: 'a1b2c3d4-369e-4772-8bf7-943a6ac70583',
      name: 'Détecteur de fumée',
      selector: 'detecteur-fumee',
      features: [],
    },
  ]),
  getCompatibleAlarms: fake.resolves([
    { name: 'Maison', selector: 'house-alarm:maison', house: { selector: 'maison' } },
  ]),
};

describe('HomeKitController GET /api/v1/service/homekit/device', () => {
  let controller;

  beforeEach(() => {
    controller = HomeKitController(homekitHandler);
    sinon.reset();
  });

  it('should return the devices the bridge is able to expose', async () => {
    const req = {};
    const res = {
      json: fake.returns([]),
    };

    await controller['get /api/v1/service/homekit/device'].controller(req, res);

    assert.calledOnce(homekitHandler.getCompatibleDevices);
    assert.calledOnce(homekitHandler.getCompatibleAlarms);
    // only what the selection screen needs, not the whole device with its features — and the house
    // alarm alongside them, so it can be left out like any other accessory
    assert.calledWith(res.json, [
      { name: 'Lampe salon', selector: 'lampe-salon' },
      { name: 'Détecteur de fumée', selector: 'detecteur-fumee' },
      { name: 'Maison', selector: 'house-alarm:maison' },
    ]);
  });
});
