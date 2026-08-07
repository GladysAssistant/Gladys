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
  it('should merge thermostat, air conditioning and temperature features into one service', async () => {
    homekitHandler.buildService = sinon.stub().returns('builded-service');
    const addService = sinon.stub();
    homekitHandler.hap = {
      Accessory: sinon.stub().returns({ addService, services: ['service1', 'service2'] }),
    };

    const device = {
      id: 'c22a4d4b-e261-4b22-a2be-309baf12c3ca',
      name: 'Thermostat',
      features: [
        {
          name: 'Température',
          category: 'temperature-sensor',
          type: 'decimal',
        },
        {
          name: 'Chauffage',
          category: 'thermostat',
          type: 'target-temperature',
        },
        {
          name: 'Refroidissement',
          category: 'air-conditioning',
          type: 'target-temperature',
        },
        {
          name: 'Mode',
          category: 'air-conditioning',
          type: 'mode',
        },
      ],
    };

    await homekitHandler.buildAccessory(device);

    expect(homekitHandler.buildService.callCount).to.equal(1);
    expect(homekitHandler.buildService.args[0][1]).to.have.deep.members(device.features);
    expect(addService.callCount).to.equal(1);
  });

  it('should keep extra temperature sensors out of the thermostat service', async () => {
    homekitHandler.buildService = sinon.stub().returns('builded-service');
    const addService = sinon.stub();
    homekitHandler.hap = {
      Accessory: sinon.stub().returns({ addService, services: ['service1', 'service2'] }),
    };

    const device = {
      id: 'c22a4d4b-e261-4b22-a2be-309baf12c3ca',
      name: 'Thermostat',
      features: [
        {
          name: 'Température intérieure',
          category: 'temperature-sensor',
          type: 'decimal',
        },
        {
          name: 'Température extérieure',
          category: 'temperature-sensor',
          type: 'decimal',
        },
        {
          name: 'Chauffage',
          category: 'thermostat',
          type: 'target-temperature',
        },
      ],
    };

    await homekitHandler.buildAccessory(device);

    expect(homekitHandler.buildService.callCount).to.equal(2);
    // the second sensor keeps its own TemperatureSensor service
    expect(homekitHandler.buildService.args[0][1]).to.have.deep.members([device.features[1]]);
    expect(homekitHandler.buildService.args[0][2].service).to.equal('TemperatureSensor');
    expect(homekitHandler.buildService.args[1][1]).to.have.deep.members([device.features[2], device.features[0]]);
    expect(homekitHandler.buildService.args[1][2].service).to.equal('Thermostat');
    expect(addService.callCount).to.equal(2);
  });

  it('should leave a temperature sensor alone when the device has no thermostat', async () => {
    homekitHandler.buildService = sinon.stub().returns('builded-service');
    const addService = sinon.stub();
    homekitHandler.hap = {
      Accessory: sinon.stub().returns({ addService, services: ['service1', 'service2'] }),
    };

    const device = {
      id: 'c22a4d4b-e261-4b22-a2be-309baf12c3ca',
      name: 'Capteur',
      features: [
        {
          name: 'Température',
          category: 'temperature-sensor',
          type: 'decimal',
        },
      ],
    };

    await homekitHandler.buildAccessory(device);

    expect(homekitHandler.buildService.callCount).to.equal(1);
    expect(homekitHandler.buildService.args[0][2].service).to.equal('TemperatureSensor');
  });
});
