const { expect } = require('chai');
const { fake, stub } = require('sinon');
const HomeKitController = require('../../../../services/homekit/api/homekit.controller');

const homekitHandler = {
  createBridge: stub(),
};

const res = {
  json: fake.returns(null),
};

describe('get /api/v1/service/homekit/reload', () => {
  it('should reload HomeKit bridge', async () => {
    const homekitController = HomeKitController(homekitHandler);

    await homekitController['get /api/v1/service/homekit/reload'].controller({}, res);
    expect(homekitHandler.createBridge.callCount).to.eq(1);
  });
});
