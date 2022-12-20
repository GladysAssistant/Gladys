const { expect } = require('chai');
const sinon = require('sinon');
const { buildAccessory } = require('../../../../services/homekit/lib/buildAccessory');

describe('Build accessory', () => {
  const homekitHandler = {
    serviceId: '7056e3d4-31cc-4d2a-bbdd-128cd49755e6',
    buildAccessory,
    buildService: sinon.stub().returns('builded-service'),
    gladys: {},
  };

  it('should build an accessory', async () => {
    const addService = sinon.stub();
    homekitHandler.hap = {
      Accessory: sinon.stub().returns({ addService, services: ['service1', 'service2'] }),
    };

    const device = {
      id: 'c22a4d4b-e261-4b22-a2be-309baf12c3ca',
      name: 'Accessory test',
      features: [
        {
          name: 'Luminosité',
          category: 'light',
          type: 'brightness',
        },
        {
          name: 'onoff',
          category: 'light',
          type: 'binary',
        },
        {
          name: 'Température',
          category: 'temperature-sensor',
          type: 'decimal',
        },
      ],
    };

    await homekitHandler.buildAccessory(device);

    expect(homekitHandler.buildService.callCount).to.equal(2);
    expect(homekitHandler.buildService.args[0][1]).to.have.deep.members([
      { name: 'Luminosité', category: 'light', type: 'brightness' },
      { name: 'onoff', category: 'light', type: 'binary' },
    ]);
    expect(homekitHandler.buildService.args[1][1]).to.have.deep.members([
      { name: 'Température', category: 'temperature-sensor', type: 'decimal' },
    ]);
    expect(addService.callCount).to.equal(2);
  });
});
