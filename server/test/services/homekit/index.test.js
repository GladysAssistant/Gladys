const { expect } = require('chai');
const { stub } = require('sinon');

const HomeKitService = require('../../../services/homekit/index');
const { DEVICE_FEATURE_CATEGORIES } = require('../../../utils/constants');

describe('HomeKitService', () => {
  let gladys;
  let homekitService;

  before(() => {
    gladys = {
      device: {
        get: stub().resolves([
          {
            id: '07f16117-8556-4b50-b9f0-e190d08f8d92',
            name: 'Lampe bureau',
            features: [{ category: DEVICE_FEATURE_CATEGORIES.LIGHT }],
          },
        ]),
      },
      variable: {
        getValue: stub().resolves(null),
      },
      system: {
        isDocker: stub().resolves(false),
      },
    };
    homekitService = HomeKitService(gladys);
  });

  it('should start service', async () => {
    const setValue = stub().resolves({});
    gladys.variable.setValue = setValue;

    await homekitService.start();

    expect(homekitService)
      .to.have.property('start')
      .and.be.instanceOf(Function);
    expect(setValue.callCount).to.equal(3);
    expect(setValue.args[0][1]).to.match(/^\d{3}-\d{2}-\d{3}$/);
    expect(setValue.args[1][1]).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(setValue.args[2][1]).to.match(/^X-HM:\/\/[0-9A-Z]+$/);
  });

  it('should stop service', async () => {
    await homekitService.stop();
    expect(homekitService)
      .to.have.property('stop')
      .and.be.instanceOf(Function);
  });
});
