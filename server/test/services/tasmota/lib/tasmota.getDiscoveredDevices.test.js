const { expect } = require('chai');
const sinon = require('sinon');

const TasmotaHandler = require('../../../../services/tasmota/lib');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const existingDevice = {
  external_id: 'alreadyExists',
  name: 'alreadyExists',
  model: 'sonoff-basic',
  room_id: 'room_id',
  features: [
    {
      name: 'feature 1',
      type: 'type 1',
      category: 'category 1',
      external_id: 'external_id:1',
    },
    {
      name: 'feature 2',
      type: 'type 2',
      category: 'category 2',
      external_id: 'external_id:2',
    },
  ],
  params: [],
};

const gladys = {
  stateManager: {
    get: (key, externalId) => {
      if (externalId === 'alreadyExists') {
        return existingDevice;
      }
      return undefined;
    },
  },
};
const serviceId = 'service-uuid-random';

describe('Tasmota - MQTT - getDiscoveredDevices', () => {
  let tasmotaHandler;
  let protocolHandler;
  const protocol = 'mqtt';
  const defaultElectricMeterFeatureId = 'default-energy-feature-id';

  beforeEach(() => {
    tasmotaHandler = new TasmotaHandler(gladys, serviceId);
    protocolHandler = tasmotaHandler.protocols[protocol];
    sinon.spy(protocolHandler, 'handleMessage');
  });

  afterEach(() => {
    sinon.reset();
  });

  it('nothing discovered', () => {
    const result = tasmotaHandler.getDiscoveredDevices(protocol, defaultElectricMeterFeatureId);
    expect(result).to.be.lengthOf(0);
  });

  it('discovered already in Gladys', () => {
    protocolHandler.discoveredDevices.alreadyExists = existingDevice;
    const result = tasmotaHandler.getDiscoveredDevices(protocol, defaultElectricMeterFeatureId);
    expect(result).to.be.lengthOf(1);
    expect(result).deep.eq([{ ...existingDevice, updatable: false }]);
  });

  it('discovered already in Gladys, but updated (basic to pow)', () => {
    protocolHandler.discoveredDevices.alreadyExists = {
      external_id: 'alreadyExists',
      model: 'sonoff-pow',
      features: [
        {
          name: 'feature 1',
          type: 'type 1',
          category: 'category 1',
          external_id: 'external_id:1',
        },
        {
          name: 'feature 2 bis',
          type: 'type 2',
          category: 'category 2',
          external_id: 'external_id:2',
          min: 10,
        },
        {
          name: 'feature 3',
          type: 'type 3',
          category: 'category 3',
          external_id: 'external_id:3',
        },
      ],
    };
    const result = tasmotaHandler.getDiscoveredDevices(protocol, defaultElectricMeterFeatureId);
    expect(result).to.be.lengthOf(1);

    const expectedDevice = {
      external_id: 'alreadyExists',
      model: 'sonoff-pow',
      name: 'alreadyExists',
      room_id: 'room_id',
      features: [
        {
          name: 'feature 1',
          type: 'type 1',
          category: 'category 1',
          external_id: 'external_id:1',
        },
        {
          name: 'feature 2',
          type: 'type 2',
          category: 'category 2',
          external_id: 'external_id:2',
          min: 10,
        },
        {
          name: 'feature 3',
          type: 'type 3',
          category: 'category 3',
          external_id: 'external_id:3',
        },
      ],
      updatable: true,
      params: [],
    };

    expect(result).deep.eq([expectedDevice]);
  });

  it('discovered not already in Gladys', () => {
    protocolHandler.discoveredDevices.notAlreadyExists = {
      external_id: 'notAlreadyExists',
    };
    const result = tasmotaHandler.getDiscoveredDevices(protocol, defaultElectricMeterFeatureId);
    expect(result).to.be.lengthOf(1);
    expect(result).deep.eq([protocolHandler.discoveredDevices.notAlreadyExists]);
  });

  it('adds energy consumption features only for total energy index', () => {
    protocolHandler.discoveredDevices.energyDevice = {
      external_id: 'tasmota:device-1',
      features: [
        {
          id: 'total-id',
          name: 'Energy total',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY,
          external_id: 'tasmota:device-1:ENERGY:Total',
          selector: 'tasmota:device-1:ENERGY:Total',
        },
        {
          id: 'today-id',
          name: 'Energy today',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY,
          external_id: 'tasmota:device-1:ENERGY:Today',
          selector: 'tasmota:device-1:ENERGY:Today',
        },
        {
          id: 'yesterday-id',
          name: 'Energy yesterday',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY,
          external_id: 'tasmota:device-1:ENERGY:Yesterday',
          selector: 'tasmota:device-1:ENERGY:Yesterday',
        },
      ],
    };

    const [result] = tasmotaHandler.getDiscoveredDevices(protocol, defaultElectricMeterFeatureId);

    const consumptionFeature = result.features.find(
      (f) =>
        f.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION &&
        f.external_id === 'tasmota:device-1:ENERGY:Total_consumption',
    );
    expect(consumptionFeature).to.not.equal(undefined);
    expect(consumptionFeature.energy_parent_id).to.eq('total-id');

    const costFeature = result.features.find(
      (f) =>
        f.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST &&
        f.external_id === 'tasmota:device-1:ENERGY:Total_cost',
    );
    expect(costFeature).to.not.equal(undefined);
    expect(costFeature.energy_parent_id).to.eq(consumptionFeature.id);

    const todayConsumptionFeature = result.features.find((f) => f.external_id.includes('ENERGY:Today_consumption'));
    const yesterdayConsumptionFeature = result.features.find((f) =>
      f.external_id.includes('ENERGY:Yesterday_consumption'),
    );
    expect(todayConsumptionFeature).to.equal(undefined);
    expect(yesterdayConsumptionFeature).to.equal(undefined);
  });

  it('does not duplicate existing energy consumption features with ":" external ids', () => {
    const existingWithConsumption = {
      external_id: 'energyDevice',
      name: 'energyDevice',
      model: 'sonoff-pow',
      room_id: 'room_id',
      features: [
        {
          id: 'total-id',
          name: 'Energy total',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY,
          external_id: 'tasmota:device-1:ENERGY:Total',
          selector: 'tasmota:device-1:ENERGY:Total',
        },
        {
          id: 'consumption-id',
          name: 'Energy total (consumption)',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
          external_id: 'tasmota:device-1:ENERGY:Total:consumption',
          selector: 'tasmota:device-1:ENERGY:Total:consumption',
          energy_parent_id: 'total-id',
        },
        {
          id: 'cost-id',
          name: 'Energy total (cost)',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
          external_id: 'tasmota:device-1:ENERGY:Total:cost',
          selector: 'tasmota:device-1:ENERGY:Total:cost',
          energy_parent_id: 'consumption-id',
        },
      ],
      params: [],
    };

    tasmotaHandler.gladys.stateManager.get = (key, externalId) => {
      if (externalId === 'energyDevice') {
        return existingWithConsumption;
      }
      return undefined;
    };

    protocolHandler.discoveredDevices.energyDevice = {
      external_id: 'energyDevice',
      features: [
        {
          id: 'total-id',
          name: 'Energy total',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY,
          external_id: 'tasmota:device-1:ENERGY:Total',
          selector: 'tasmota:device-1:ENERGY:Total',
        },
      ],
    };

    const [result] = tasmotaHandler.getDiscoveredDevices(protocol, defaultElectricMeterFeatureId);

    const consumptionFeatures = result.features.filter(
      (f) => f.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
    );
    const costFeatures = result.features.filter(
      (f) => f.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
    );

    expect(consumptionFeatures).to.have.lengthOf(1);
    expect(costFeatures).to.have.lengthOf(1);
    expect(consumptionFeatures[0].external_id).to.eq('tasmota:device-1:ENERGY:Total:consumption');
    expect(costFeatures[0].external_id).to.eq('tasmota:device-1:ENERGY:Total:cost');
  });

  it('drops custom features not present in discovery (documented behavior)', () => {
    const existingWithCustom = {
      external_id: 'customDevice',
      name: 'customDevice',
      model: 'sonoff-pow',
      room_id: 'room_id',
      features: [
        {
          name: 'Custom feature',
          category: 'custom-category',
          type: 'custom-type',
          external_id: 'custom:feature:1',
        },
      ],
      params: [],
    };

    tasmotaHandler.gladys.stateManager.get = (key, externalId) => {
      if (externalId === 'customDevice') {
        return existingWithCustom;
      }
      return undefined;
    };

    protocolHandler.discoveredDevices.customDevice = {
      external_id: 'customDevice',
      features: [
        {
          id: 'total-id',
          name: 'Energy total',
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY,
          external_id: 'tasmota:device-1:ENERGY:Total',
          selector: 'tasmota:device-1:ENERGY:Total',
        },
      ],
    };

    const [result] = tasmotaHandler.getDiscoveredDevices(protocol, defaultElectricMeterFeatureId);

    const customFeature = result.features.find((f) => f.external_id === 'custom:feature:1');
    expect(customFeature).to.equal(undefined);
  });
});

describe('Tasmota - HTTP - getDiscoveredDevices', () => {
  let tasmotaHandler;
  let protocolHandler;
  const protocol = 'http';
  const defaultElectricMeterFeatureId = 'default-energy-feature-id';

  beforeEach(() => {
    tasmotaHandler = new TasmotaHandler(gladys, serviceId);
    protocolHandler = tasmotaHandler.protocols[protocol];
    sinon.reset();
  });

  it('nothing discovered', () => {
    const result = tasmotaHandler.getDiscoveredDevices(protocol, defaultElectricMeterFeatureId);
    expect(result).to.be.lengthOf(0);
  });

  it('discovered already in Gladys', () => {
    protocolHandler.discoveredDevices.alreadyExists = existingDevice;
    const result = tasmotaHandler.getDiscoveredDevices(protocol, defaultElectricMeterFeatureId);
    expect(result).to.be.lengthOf(1);
    expect(result).deep.eq([{ ...existingDevice, updatable: false }]);
  });

  it('discovered already in Gladys, but updated (basic to pow)', () => {
    protocolHandler.discoveredDevices.alreadyExists = {
      external_id: 'alreadyExists',
      model: 'sonoff-pow',
      features: [
        {
          name: 'feature 1',
          type: 'type 1',
          category: 'category 1',
          external_id: 'external_id:1',
        },
        {
          name: 'feature 2 bis',
          type: 'type 2',
          category: 'category 2',
          external_id: 'external_id:2',
          min: 0,
        },
        {
          name: 'feature 3',
          type: 'type 3',
          category: 'category 3',
          external_id: 'external_id:3',
        },
      ],
    };
    const result = tasmotaHandler.getDiscoveredDevices(protocol, defaultElectricMeterFeatureId);
    expect(result).to.be.lengthOf(1);

    const expectedDevice = {
      external_id: 'alreadyExists',
      model: 'sonoff-pow',
      name: 'alreadyExists',
      updatable: true,
      room_id: 'room_id',
      features: [
        {
          name: 'feature 1',
          type: 'type 1',
          category: 'category 1',
          external_id: 'external_id:1',
        },
        {
          name: 'feature 2',
          type: 'type 2',
          category: 'category 2',
          external_id: 'external_id:2',
          min: 0,
        },
        {
          name: 'feature 3',
          type: 'type 3',
          category: 'category 3',
          external_id: 'external_id:3',
        },
      ],
      params: [],
    };

    expect(result).deep.eq([expectedDevice]);
  });

  it('discovered already in Gladys, but updated (on params)', () => {
    protocolHandler.discoveredDevices.alreadyExists = {
      external_id: 'alreadyExists',
      name: 'alreadyExists',
      model: 'sonoff-basic',
      features: [
        {
          name: 'feature 1',
          type: 'type 1',
          category: 'category 1',
          external_id: 'external_id:1',
        },
        {
          name: 'feature 2',
          type: 'type 2',
          category: 'category 2',
          external_id: 'external_id:2',
        },
      ],
      params: [
        {
          name: 'protocol',
          value: 'http',
        },
      ],
    };
    const result = tasmotaHandler.getDiscoveredDevices(protocol, defaultElectricMeterFeatureId);
    expect(result).to.be.lengthOf(1);

    const expectedDevice = {
      external_id: 'alreadyExists',
      name: 'alreadyExists',
      model: 'sonoff-basic',
      updatable: true,
      room_id: 'room_id',
      features: [
        {
          name: 'feature 1',
          type: 'type 1',
          category: 'category 1',
          external_id: 'external_id:1',
        },
        {
          name: 'feature 2',
          type: 'type 2',
          category: 'category 2',
          external_id: 'external_id:2',
        },
      ],
      params: [
        {
          name: 'protocol',
          value: 'http',
        },
      ],
    };

    expect(result).deep.eq([expectedDevice]);
  });

  it('discovered not already in Gladys', () => {
    protocolHandler.discoveredDevices.notAlreadyExists = {
      external_id: 'notAlreadyExists',
    };
    const result = tasmotaHandler.getDiscoveredDevices(protocol, defaultElectricMeterFeatureId);
    expect(result).to.be.lengthOf(1);
    expect(result).deep.eq([protocolHandler.discoveredDevices.notAlreadyExists]);
  });
});
