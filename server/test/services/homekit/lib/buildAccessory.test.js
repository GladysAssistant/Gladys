const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const { buildAccessory } = require('../../../../services/homekit/lib/buildAccessory');
const { findFeatureService } = require('../../../../services/homekit/lib/featureServices');

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
  it('should build a single battery service from the level and the low flag', async () => {
    homekitHandler.buildService = sinon.stub().returns('builded-service');
    const addService = sinon.stub();
    homekitHandler.hap = {
      Accessory: sinon.stub().returns({ addService, services: ['service1', 'service2'] }),
    };

    const device = {
      id: 'c22a4d4b-e261-4b22-a2be-309baf12c3ca',
      name: 'Serrure',
      features: [
        { name: 'Batterie', category: 'battery', type: 'integer' },
        { name: 'Batterie faible', category: 'battery-low', type: 'binary' },
      ],
    };

    await homekitHandler.buildAccessory(device);

    // one Battery service, not two
    expect(homekitHandler.buildService.callCount).to.equal(1);
    expect(homekitHandler.buildService.args[0][1]).to.have.deep.members(device.features);
    expect(homekitHandler.buildService.args[0][3]).to.equal(undefined);
    expect(addService.callCount).to.equal(1);
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

  it('should index every service by the features it was built from', async () => {
    homekitHandler.buildService = sinon.stub();
    homekitHandler.buildService.onFirstCall().returns('switch-service-1');
    homekitHandler.buildService.onSecondCall().returns('switch-service-2');
    const addService = sinon.stub();
    const accessory = { addService, services: ['service1', 'service2'] };
    homekitHandler.hap = {
      Accessory: sinon.stub().returns(accessory),
    };

    const device = {
      id: 'c22a4d4b-e261-4b22-a2be-309baf12c3ca',
      name: 'Double interrupteur',
      features: [
        { selector: 'switch-1', name: 'Switch 1', category: 'switch', type: 'binary', read_only: false },
        { selector: 'switch-2', name: 'Switch 2', category: 'switch', type: 'binary', read_only: false },
      ],
    };

    await homekitHandler.buildAccessory(device);

    // sendState resolves through this index, so the second switch reaches its own service instead
    // of the first one getService would return
    expect(findFeatureService(accessory, device.features[0])).to.equal('switch-service-1');
    expect(findFeatureService(accessory, device.features[1])).to.equal('switch-service-2');
  });

  it('should index the read-only twin dropped from a service onto that service', async () => {
    homekitHandler.buildService = sinon.stub().returns('fan-service');
    const addService = sinon.stub();
    const accessory = { addService, services: ['service1', 'service2'] };
    homekitHandler.hap = {
      Accessory: sinon.stub().returns(accessory),
    };

    const device = {
      id: 'c22a4d4b-e261-4b22-a2be-309baf12c3ca',
      name: 'Ventilateur',
      features: [
        { selector: 'fan-speed', name: 'Speed %', category: 'fan', type: 'percent', read_only: false },
        { selector: 'fan-speed-current', name: 'Speed % current', category: 'fan', type: 'percent', read_only: true },
      ],
    };

    await homekitHandler.buildAccessory(device);

    // the read-only twin builds no characteristic of its own, but an update on it still has to
    // reach the Fanv2 service its writable twin was built into
    expect(homekitHandler.buildService.args[0][1]).to.have.deep.members([device.features[0]]);
    expect(findFeatureService(accessory, device.features[0])).to.equal('fan-service');
    expect(findFeatureService(accessory, device.features[1])).to.equal('fan-service');
  });

  it('should index the writable twin dropped from a service onto that service', async () => {
    homekitHandler.buildService = sinon.stub().returns('fan-service');
    const addService = sinon.stub();
    const accessory = { addService, services: ['service1', 'service2'] };
    homekitHandler.hap = {
      Accessory: sinon.stub().returns(accessory),
    };

    // the read-only counterpart comes first this time, so it is the one replaced in the config
    const device = {
      id: 'c22a4d4b-e261-4b22-a2be-309baf12c3ca',
      name: 'Ventilateur',
      features: [
        { selector: 'fan-speed-current', name: 'Speed % current', category: 'fan', type: 'percent', read_only: true },
        { selector: 'fan-speed', name: 'Speed %', category: 'fan', type: 'percent', read_only: false },
      ],
    };

    await homekitHandler.buildAccessory(device);

    expect(homekitHandler.buildService.args[0][1]).to.have.deep.members([device.features[1]]);
    expect(findFeatureService(accessory, device.features[0])).to.equal('fan-service');
    expect(findFeatureService(accessory, device.features[1])).to.equal('fan-service');
  });

  it('should index a merged service under every feature it carries', async () => {
    homekitHandler.buildService = sinon.stub().returns('thermostat-service');
    const addService = sinon.stub();
    const accessory = { addService, services: ['service1', 'service2'] };
    homekitHandler.hap = {
      Accessory: sinon.stub().returns(accessory),
    };

    const device = {
      id: 'c22a4d4b-e261-4b22-a2be-309baf12c3ca',
      name: 'Thermostat',
      features: [
        { selector: 'room-temperature', name: 'Température', category: 'temperature-sensor', type: 'decimal' },
        { selector: 'setpoint', name: 'Chauffage', category: 'thermostat', type: 'target-temperature' },
      ],
    };

    await homekitHandler.buildAccessory(device);

    // both the host feature and the temperature folded into it point at the Thermostat service
    expect(findFeatureService(accessory, device.features[0])).to.equal('thermostat-service');
    expect(findFeatureService(accessory, device.features[1])).to.equal('thermostat-service');
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

  it('should give a subtype to every Gladys category landing on one HomeKit service', async () => {
    homekitHandler.buildService = sinon.stub().returns('builded-service');
    const addService = sinon.stub();
    homekitHandler.hap = {
      Accessory: sinon.stub().returns({ addService, services: ['service1', 'service2'] }),
    };

    // a Zigbee2mqtt detector carrying its own siren: two Gladys categories, one HomeKit Switch
    const device = {
      id: 'c22a4d4b-e261-4b22-a2be-309baf12c3ca',
      name: 'Detecteur cave',
      features: [
        { selector: 'relais', name: 'Relais', category: 'switch', type: 'binary' },
        { selector: 'sirene', name: 'Sirène', category: 'siren', type: 'binary' },
      ],
    };

    await homekitHandler.buildAccessory(device);

    expect(homekitHandler.buildService.callCount).to.equal(2);
    // both are a Switch, so HAP needs to tell them apart — and neither keeps the bare service, which
    // would otherwise hand one of them the identity the other had before
    expect(homekitHandler.buildService.args[0][2].service).to.equal('Switch');
    expect(homekitHandler.buildService.args[1][2].service).to.equal('Switch');
    expect(homekitHandler.buildService.args[0][3]).to.equal('switch');
    expect(homekitHandler.buildService.args[1][3]).to.equal('siren');
  });

  it('should give each category the same subtype whatever order the features come in', async () => {
    homekitHandler.buildService = sinon.stub().returns('builded-service');
    const addService = sinon.stub();
    homekitHandler.hap = {
      Accessory: sinon.stub().returns({ addService, services: ['service1', 'service2'] }),
    };

    // the same device, its features read the other way round: the subtype takes part in the
    // identifiers HAP persists, so it may not depend on the order features happen to arrive in
    const device = {
      id: 'c22a4d4b-e261-4b22-a2be-309baf12c3ca',
      name: 'Detecteur cave',
      features: [
        { selector: 'sirene', name: 'Sirène', category: 'siren', type: 'binary' },
        { selector: 'relais', name: 'Relais', category: 'switch', type: 'binary' },
      ],
    };

    await homekitHandler.buildAccessory(device);

    expect(homekitHandler.buildService.args[0][3]).to.equal('siren');
    expect(homekitHandler.buildService.args[1][3]).to.equal('switch');
  });

  it('should leave the bare service to a category that shares it with nobody', async () => {
    homekitHandler.buildService = sinon.stub().returns('builded-service');
    const addService = sinon.stub();
    homekitHandler.hap = {
      Accessory: sinon.stub().returns({ addService, services: ['service1', 'service2'] }),
    };

    // no siren here, so the switch keeps the subtype it has always had and a paired home does not
    // see its service change identity
    const device = {
      id: 'c22a4d4b-e261-4b22-a2be-309baf12c3ca',
      name: 'Prise salon',
      features: [
        { selector: 'relais', name: 'Relais', category: 'switch', type: 'binary' },
        { selector: 'temperature', name: 'Température', category: 'temperature-sensor', type: 'decimal' },
      ],
    };

    await homekitHandler.buildAccessory(device);

    expect(homekitHandler.buildService.args[0][3]).to.equal(undefined);
    expect(homekitHandler.buildService.args[1][3]).to.equal(undefined);
  });

  it('should still number several services built from a single category', async () => {
    homekitHandler.buildService = sinon.stub().returns('builded-service');
    const addService = sinon.stub();
    homekitHandler.hap = {
      Accessory: sinon.stub().returns({ addService, services: ['service1', 'service2'] }),
    };

    const device = {
      id: 'c22a4d4b-e261-4b22-a2be-309baf12c3ca',
      name: 'Volets salon',
      features: [
        { selector: 'volet-1', name: 'Volet 1', category: 'shutter', type: 'position' },
        { selector: 'volet-2', name: 'Volet 2', category: 'shutter', type: 'position' },
      ],
    };

    await homekitHandler.buildAccessory(device);

    expect(homekitHandler.buildService.args[0][3]).to.equal('shutter 1');
    expect(homekitHandler.buildService.args[1][3]).to.equal('shutter 2');
  });

  it('should name the accessory with a name HomeKit accepts', async () => {
    homekitHandler.buildService = sinon.stub().returns('builded-service');
    const addService = sinon.stub();
    homekitHandler.hap = {
      Accessory: sinon.stub().returns({ addService, services: ['service1', 'service2'] }),
    };

    const device = {
      id: 'c22a4d4b-e261-4b22-a2be-309baf12c3ca',
      name: 'Detecteur_Cave ',
      features: [{ selector: 'sirene', name: 'Sirène', category: 'siren', type: 'binary' }],
    };

    await homekitHandler.buildAccessory(device);

    expect(homekitHandler.hap.Accessory.args[0][0]).to.equal('Detecteur Cave');
  });
});
