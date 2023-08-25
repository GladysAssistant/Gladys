const { expect } = require('chai');
const { fake, stub } = require('sinon');
const HomeKitController = require('../../../../services/homekit/api/homekit.controller');

const homekitHandler = {
  createBridge: stub(),
  resetBridge: stub(),
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

describe('get /api/v1/service/homekit/reset', () => {
  it('should reset HomeKit bridge', async () => {
    const homekitController = HomeKitController(homekitHandler);

    await homekitController['get /api/v1/service/homekit/reset'].controller({}, res);
    expect(homekitHandler.resetBridge.callCount).to.eq(1);
  });
});
