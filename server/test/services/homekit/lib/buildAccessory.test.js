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

  it('should build a single air quality service from the index and the densities', async () => {
    homekitHandler.buildService = sinon.stub().returns('builded-service');
    const addService = sinon.stub();
    homekitHandler.hap = {
      Accessory: sinon.stub().returns({ addService, services: ['service1', 'service2'] }),
    };

    const device = {
      id: 'c22a4d4b-e261-4b22-a2be-309baf12c3ca',
      name: 'Capteur qualité air',
      features: [
        { name: 'Indice', category: 'airquality-sensor', type: 'aqi' },
        { name: 'PM2.5', category: 'pm25-sensor', type: 'decimal' },
        { name: 'PM10', category: 'pm10-sensor', type: 'decimal' },
      ],
    };

    await homekitHandler.buildAccessory(device);

    // one AirQualitySensor service, not three
    expect(homekitHandler.buildService.callCount).to.equal(1);
    expect(homekitHandler.buildService.args[0][1]).to.have.deep.members(device.features);
    // no subtype, so the Home app shows a single tile
    expect(homekitHandler.buildService.args[0][3]).to.equal(undefined);
    expect(addService.callCount).to.equal(1);
  });

  it('should host the air quality service on the density when there is no index', async () => {
    homekitHandler.buildService = sinon.stub().returns('builded-service');
    const addService = sinon.stub();
    homekitHandler.hap = {
      Accessory: sinon.stub().returns({ addService, services: ['service1', 'service2'] }),
    };

    const device = {
      id: 'c22a4d4b-e261-4b22-a2be-309baf12c3ca',
      name: 'Capteur particules',
      features: [
        { name: 'PM2.5', category: 'pm25-sensor', type: 'decimal' },
        { name: 'PM10', category: 'pm10-sensor', type: 'decimal' },
      ],
    };

    await homekitHandler.buildAccessory(device);

    expect(homekitHandler.buildService.callCount).to.equal(1);
    expect(homekitHandler.buildService.args[0][1]).to.have.deep.members(device.features);
  });
  it('should keep the writable feature when a read-only twin exists', async () => {
    homekitHandler.buildService = sinon.stub().returns('builded-service');
    const addService = sinon.stub();
    homekitHandler.hap = {
      Accessory: sinon.stub().returns({ addService, services: ['service1', 'service2'] }),
    };

    const device = {
      id: 'c22a4d4b-e261-4b22-a2be-309baf12c3ca',
      name: 'Ventilateur',
      features: [
        {
          name: 'Speed %',
          category: 'fan',
          type: 'percent',
          read_only: false,
        },
        {
          name: 'Speed % current',
          category: 'fan',
          type: 'percent',
          read_only: true,
        },
        {
          name: 'Oscillation',
          category: 'fan',
          type: 'rock-setting',
          read_only: false,
        },
      ],
    };

    await homekitHandler.buildAccessory(device);

    // a single Fanv2 service, built from the writable percent feature
    expect(homekitHandler.buildService.callCount).to.equal(1);
    expect(homekitHandler.buildService.args[0][1]).to.have.deep.members([
      { name: 'Speed %', category: 'fan', type: 'percent', read_only: false },
      { name: 'Oscillation', category: 'fan', type: 'rock-setting', read_only: false },
    ]);
    expect(addService.callCount).to.equal(1);
  });

  it('should keep the writable feature whichever order the twins come in', async () => {
    homekitHandler.buildService = sinon.stub().returns('builded-service');
    const addService = sinon.stub();
    homekitHandler.hap = {
      Accessory: sinon.stub().returns({ addService, services: ['service1', 'service2'] }),
    };

    // the read-only counterpart comes first this time
    const device = {
      id: 'c22a4d4b-e261-4b22-a2be-309baf12c3ca',
      name: 'Ventilateur',
      features: [
        {
          name: 'Speed % current',
          category: 'fan',
          type: 'percent',
          read_only: true,
        },
        {
          name: 'Speed %',
          category: 'fan',
          type: 'percent',
          read_only: false,
        },
      ],
    };

    await homekitHandler.buildAccessory(device);

    expect(homekitHandler.buildService.callCount).to.equal(1);
    expect(homekitHandler.buildService.args[0][1]).to.have.deep.members([device.features[1]]);
    expect(addService.callCount).to.equal(1);
  });

  it('should not merge a read-only twin of a feature type that did not ask for it', async () => {
    homekitHandler.buildService = sinon.stub().returns('builded-service');
    const addService = sinon.stub();
    homekitHandler.hap = {
      Accessory: sinon.stub().returns({ addService, services: ['service1', 'service2'] }),
    };

    // Matter exposes an OnOff relay and a BooleanState sensor as the same category and type, but
    // they are two separate things and must stay two services.
    const device = {
      id: 'c22a4d4b-e261-4b22-a2be-309baf12c3ca',
      name: 'Matter',
      features: [
        {
          name: 'OnOff',
          category: 'switch',
          type: 'binary',
          read_only: false,
        },
        {
          name: 'BooleanState',
          category: 'switch',
          type: 'binary',
          read_only: true,
        },
      ],
    };

    await homekitHandler.buildAccessory(device);

    expect(homekitHandler.buildService.callCount).to.equal(2);
    expect(homekitHandler.buildService.args[0][1]).to.have.deep.members([device.features[0]]);
    expect(homekitHandler.buildService.args[1][1]).to.have.deep.members([device.features[1]]);
    expect(addService.callCount).to.equal(2);
  });

  it('should still split identical features into several services', async () => {
    homekitHandler.buildService = sinon.stub().returns('builded-service');
    const addService = sinon.stub();
    homekitHandler.hap = {
      Accessory: sinon.stub().returns({ addService, services: ['service1', 'service2'] }),
    };

    const device = {
      id: 'c22a4d4b-e261-4b22-a2be-309baf12c3ca',
      name: 'Double interrupteur',
      features: [
        {
          name: 'Switch 1',
          category: 'switch',
          type: 'binary',
          read_only: false,
        },
        {
          name: 'Switch 2',
          category: 'switch',
          type: 'binary',
          read_only: false,
        },
      ],
    };

    await homekitHandler.buildAccessory(device);

    expect(homekitHandler.buildService.callCount).to.equal(2);
    expect(addService.callCount).to.equal(2);
  });
});
