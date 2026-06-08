const { expect } = require('chai');
const { fake } = require('sinon');

const {
  buildWeeklyDigestData,
  sumConsumptionValues,
  isConsumptionFeature,
  getConsumptionFeaturesForDigest,
  getMainMeterDeviceId,
  fetchEnergyConsumptionForFeature,
  shouldCheckFeatureForStale,
  formatSilentDuration,
} = require('../../../lib/gateway/gateway.buildWeeklyDigestData');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

const {
  ENERGY_SENSOR: { DAILY_CONSUMPTION, THIRTY_MINUTES_CONSUMPTION },
} = DEVICE_FEATURE_TYPES;

describe('gateway.buildWeeklyDigestData', () => {
  it('should aggregate home data', async () => {
    const gateway = {
      device: {
        get: fake.resolves([
          {
            name: 'Thermometer',
            room: { name: 'Living room' },
            features: [
              {
                name: 'Temperature',
                category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
                last_value: 21.5,
                unit: 'celsius',
                last_value_changed: new Date().toISOString(),
              },
              {
                name: 'Battery',
                category: DEVICE_FEATURE_CATEGORIES.BATTERY,
                last_value: 5,
                unit: 'percent',
                last_value_changed: new Date().toISOString(),
              },
            ],
          },
        ]),
        energySensorManager: {
          getConsumptionByDates: fake.resolves([]),
        },
      },
      scene: {
        get: fake.resolves([
          {
            name: 'Good night',
            active: true,
            last_executed: new Date().toISOString(),
          },
        ]),
      },
      variable: {
        getValue: fake.resolves('10'),
      },
      energyPrice: {
        getDefaultElectricMeterFeatureId: fake.resolves(null),
      },
    };

    const data = await buildWeeklyDigestData.call(gateway);

    expect(data.summary.device_count).to.equal(1);
    expect(data.summary.scene_count).to.equal(1);
    expect(data.temperatures).to.have.lengthOf(1);
    expect(data.low_batteries).to.have.lengthOf(1);
    expect(data.recent_scenes).to.have.lengthOf(1);
  });

  it('should include all consumption features with hierarchy metadata', async () => {
    const devices = [
      {
        id: 'meter-device',
        name: 'Main meter',
        room: { name: 'Panel' },
        features: [
          {
            id: 'meter-index-feature',
            name: 'Index',
            selector: 'main-meter-index',
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
          },
          {
            id: 'meter-feature',
            name: 'Daily consumption',
            selector: 'main-meter-consumption',
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: DAILY_CONSUMPTION,
          },
        ],
      },
      {
        id: 'plug-a',
        name: 'Plug A',
        room: { name: 'Kitchen' },
        features: [
          {
            id: 'plug-a-feature',
            name: 'Daily consumption',
            selector: 'plug-a-consumption',
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: DAILY_CONSUMPTION,
            energy_parent_id: 'meter-index-feature',
          },
        ],
      },
      {
        id: 'plug-b',
        name: 'Plug B',
        features: [
          {
            id: 'plug-b-feature',
            name: 'Daily consumption',
            selector: 'plug-b-consumption',
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: DAILY_CONSUMPTION,
            energy_parent_id: 'meter-index-feature',
          },
        ],
      },
      {
        id: 'plug-c',
        name: 'Plug C',
        features: [
          {
            id: 'plug-c-feature',
            name: 'Daily consumption',
            selector: 'plug-c-consumption',
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: DAILY_CONSUMPTION,
            energy_parent_id: 'meter-index-feature',
          },
        ],
      },
    ];

    const consumptionBySelector = {
      'main-meter-consumption': [{ values: [{ sum_value: 120 }] }],
      'plug-a-consumption': [{ values: [{ sum_value: 5 }] }],
      'plug-b-consumption': [{ values: [{ sum_value: 30 }] }],
      'plug-c-consumption': [{ values: [{ sum_value: 15 }] }],
    };

    const gateway = {
      device: {
        get: fake.resolves(devices),
        energySensorManager: {
          getConsumptionByDates: fake(async ([selector]) => consumptionBySelector[selector] ?? []),
        },
      },
      scene: {
        get: fake.resolves([]),
      },
      variable: {
        getValue: fake.resolves('10'),
      },
      energyPrice: {
        getDefaultElectricMeterFeatureId: fake.resolves('meter-feature'),
      },
    };

    const data = await buildWeeklyDigestData.call(gateway);

    expect(data.energy).to.have.lengthOf(4);
    expect(data.energy_context.configured_main_meter_device_id).to.equal('meter-device');
    expect(data.energy_context.feature_count).to.equal(4);

    const meter = data.energy.find((entry) => entry.device_name === 'Main meter');
    expect(meter).to.deep.include({
      device_id: 'meter-device',
      feature_id: 'meter-feature',
      room: 'Panel',
      is_on_configured_main_meter_device: true,
      current_week_kwh: 120,
      energy_parent_feature_id: null,
    });

    const plugB = data.energy.find((entry) => entry.device_name === 'Plug B');
    expect(plugB).to.deep.include({
      is_on_configured_main_meter_device: false,
      current_week_kwh: 30,
      energy_parent_feature_id: 'meter-index-feature',
    });
  });

  it('should include multiple consumption features on the same device', async () => {
    const devices = [
      {
        id: 'lixee-device',
        name: 'Lixee TIC',
        features: [
          {
            id: 'index-feature',
            name: 'Total index',
            selector: 'lixee-index',
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
          },
          {
            id: 'hp-feature',
            name: 'HP (consumption)',
            selector: 'lixee-hp',
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: THIRTY_MINUTES_CONSUMPTION,
            energy_parent_id: 'index-feature',
          },
          {
            id: 'hc-feature',
            name: 'HC (consumption)',
            selector: 'lixee-hc',
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: THIRTY_MINUTES_CONSUMPTION,
            energy_parent_id: 'index-feature',
          },
        ],
      },
    ];

    const consumptionBySelector = {
      'lixee-hp': [{ values: [{ sum_value: 40 }] }],
      'lixee-hc': [{ values: [{ sum_value: 19 }] }],
    };

    const gateway = {
      device: {
        get: fake.resolves(devices),
        energySensorManager: {
          getConsumptionByDates: fake(async ([selector]) => consumptionBySelector[selector] ?? []),
        },
      },
      scene: {
        get: fake.resolves([]),
      },
      variable: {
        getValue: fake.resolves('10'),
      },
      energyPrice: {
        getDefaultElectricMeterFeatureId: fake.resolves('index-feature'),
      },
    };

    const data = await buildWeeklyDigestData.call(gateway);

    expect(data.energy).to.have.lengthOf(2);
    expect(data.energy.map((entry) => entry.feature_name)).to.include.members(['HP (consumption)', 'HC (consumption)']);
    expect(data.energy.every((entry) => entry.energy_parent_feature_id === 'index-feature')).to.equal(true);
    expect(data.energy.every((entry) => entry.is_on_configured_main_meter_device)).to.equal(true);
  });
});

describe('energy digest helpers', () => {
  it('should detect consumption features', () => {
    expect(
      isConsumptionFeature({
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DAILY_CONSUMPTION,
      }),
    ).to.equal(true);
    expect(
      isConsumptionFeature({
        category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
        type: DAILY_CONSUMPTION,
      }),
    ).to.equal(false);
  });

  it('should keep main meter consumption when it is a parent feature', () => {
    const devices = [
      {
        id: 'meter-device',
        name: 'Main meter',
        features: [
          {
            id: 'meter-feature',
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: DAILY_CONSUMPTION,
          },
        ],
      },
      {
        id: 'leaf-device',
        name: 'Plug',
        features: [
          {
            id: 'leaf-feature',
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: DAILY_CONSUMPTION,
            energy_parent_id: 'meter-feature',
          },
        ],
      },
    ];

    const candidates = getConsumptionFeaturesForDigest(devices, 'meter-device');

    expect(candidates).to.have.lengthOf(2);
    expect(candidates.map((candidate) => candidate.device.name)).to.include.members(['Main meter', 'Plug']);
  });

  it('should resolve main meter device id from energy price configuration', async () => {
    const deviceId = await getMainMeterDeviceId(
      {
        energyPrice: {
          getDefaultElectricMeterFeatureId: async () => 'meter-feature',
        },
      },
      [
        {
          id: 'meter-device',
          features: [{ id: 'meter-feature' }],
        },
      ],
    );

    expect(deviceId).to.equal('meter-device');
  });

  it('should return null when energy price is not configured', async () => {
    await expect(getMainMeterDeviceId({}, [])).to.eventually.equal(null);
    await expect(
      getMainMeterDeviceId(
        {
          energyPrice: {
            getDefaultElectricMeterFeatureId: async () => null,
          },
        },
        [],
      ),
    ).to.eventually.equal(null);
    await expect(
      getMainMeterDeviceId(
        {
          energyPrice: {
            getDefaultElectricMeterFeatureId: async () => 'missing-feature',
          },
        },
        [{ id: 'device-1', features: [] }],
      ),
    ).to.eventually.equal(null);
  });

  it('should fetch energy consumption for one feature', async () => {
    const context = {
      device: {
        energySensorManager: {
          getConsumptionByDates: fake(async () => [{ values: [{ sum_value: 8 }] }]),
        },
      },
    };

    const result = await fetchEnergyConsumptionForFeature(
      context,
      {
        device: { id: 'plug-1', name: 'Plug', room: { name: 'Kitchen' } },
        feature: {
          id: 'feature-1',
          name: 'Consumption',
          selector: 'plug-consumption',
          type: DAILY_CONSUMPTION,
          energy_parent_id: 'parent-feature',
        },
      },
      new Date('2026-06-01'),
      new Date('2026-06-08'),
      new Date('2026-05-25'),
      null,
    );

    expect(result).to.deep.include({
      device_id: 'plug-1',
      device_name: 'Plug',
      feature_id: 'feature-1',
      feature_name: 'Consumption',
      feature_type: DAILY_CONSUMPTION,
      room: 'Kitchen',
      energy_parent_feature_id: 'parent-feature',
      is_on_configured_main_meter_device: false,
      current_week_kwh: 8,
      previous_week_kwh: 8,
    });
  });

  it('should return null when consumption fetch fails', async () => {
    const context = {
      device: {
        energySensorManager: {
          getConsumptionByDates: fake.rejects(new Error('db error')),
        },
      },
    };

    const result = await fetchEnergyConsumptionForFeature(
      context,
      {
        device: { id: 'plug-1', name: 'Plug' },
        feature: { id: 'feature-1', name: 'Consumption', selector: 'plug-consumption', type: DAILY_CONSUMPTION },
      },
      new Date('2026-06-01'),
      new Date('2026-06-08'),
      new Date('2026-05-25'),
      null,
    );

    expect(result).to.equal(null);
  });

  it('should return null when both weekly totals are empty', async () => {
    const context = {
      device: {
        energySensorManager: {
          getConsumptionByDates: fake.resolves([]),
        },
      },
    };

    const result = await fetchEnergyConsumptionForFeature(
      context,
      {
        device: { id: 'plug-1', name: 'Plug' },
        feature: { id: 'feature-1', name: 'Consumption', selector: 'plug-consumption', type: DAILY_CONSUMPTION },
      },
      new Date('2026-06-01'),
      new Date('2026-06-08'),
      new Date('2026-05-25'),
      null,
    );

    expect(result).to.equal(null);
  });

  it('should exclude intermediate consumption parents', () => {
    const devices = [
      {
        id: 'root-device',
        name: 'Root meter',
        features: [
          {
            id: 'root-feature',
            name: 'Root daily consumption',
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: DAILY_CONSUMPTION,
          },
        ],
      },
      {
        id: 'leaf-device',
        name: 'Lixee TIC',
        features: [
          {
            id: 'leaf-feature',
            name: 'Tempo HP',
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: DAILY_CONSUMPTION,
            energy_parent_id: 'root-feature',
          },
        ],
      },
    ];

    const candidates = getConsumptionFeaturesForDigest(devices);

    expect(candidates).to.have.lengthOf(1);
    expect(candidates[0].device.name).to.equal('Lixee TIC');
  });

  it('should keep all consumption features on the same device', () => {
    const candidates = getConsumptionFeaturesForDigest([
      {
        id: 'lixee-device',
        name: 'Lixee TIC',
        features: [
          {
            id: 'hp-feature',
            type: THIRTY_MINUTES_CONSUMPTION,
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            energy_parent_id: 'index-feature',
          },
          {
            id: 'hc-feature',
            type: THIRTY_MINUTES_CONSUMPTION,
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            energy_parent_id: 'index-feature',
          },
          {
            id: 'daily-feature',
            type: DAILY_CONSUMPTION,
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            energy_parent_id: 'index-feature',
          },
        ],
      },
    ]);

    expect(candidates).to.have.lengthOf(3);
    expect(candidates.map((candidate) => candidate.feature.id)).to.include.members([
      'hp-feature',
      'hc-feature',
      'daily-feature',
    ]);
  });
});

describe('sumConsumptionValues', () => {
  it('should sum non-subscription values', () => {
    const total = sumConsumptionValues([
      {
        deviceFeature: { is_subscription: true },
        values: [{ value: 10 }],
      },
      {
        deviceFeature: { name: 'Consumption' },
        values: [{ sum_value: 12.5 }, { sum_value: 7.5 }],
      },
    ]);

    expect(total).to.equal(20);
  });

  it('should return null for empty or invalid results', () => {
    expect(sumConsumptionValues([])).to.equal(null);
    expect(sumConsumptionValues(null)).to.equal(null);
    expect(sumConsumptionValues([{ deviceFeature: { is_subscription: true }, values: [{ value: 1 }] }])).to.equal(null);
    expect(sumConsumptionValues([{ deviceFeature: { name: 'Consumption' }, values: [] }])).to.equal(null);
  });

  it('should fallback to value when sum_value is missing', () => {
    expect(
      sumConsumptionValues([
        {
          deviceFeature: { name: 'Consumption' },
          values: [{ value: 4 }, { value: 6 }],
        },
      ]),
    ).to.equal(10);
  });
});

describe('buildWeeklyDigestData additional sensors', () => {
  it('should include humidity and stale sensors', async () => {
    const oldDate = new Date(Date.now() - 100 * 60 * 60 * 1000).toISOString();
    const gateway = {
      device: {
        get: fake.resolves([
          {
            name: 'Humidity sensor',
            room: null,
            features: [
              {
                name: 'Humidity',
                category: DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
                last_value: 55,
                unit: 'percent',
                last_value_changed: oldDate,
              },
            ],
          },
        ]),
        energySensorManager: {
          getConsumptionByDates: fake.resolves([]),
        },
      },
      scene: {
        get: fake.resolves([]),
      },
      variable: {
        getValue: fake.resolves('10'),
      },
      energyPrice: {
        getDefaultElectricMeterFeatureId: fake.resolves(null),
      },
    };

    const data = await buildWeeklyDigestData.call(gateway);

    expect(data.humidities).to.have.lengthOf(1);
    expect(data.humidities[0].room).to.equal('Unknown room');
    expect(data.stale_sensors).to.have.lengthOf(1);
    expect(data.stale_sensors[0].silent_for_days).to.be.at.least(4);
  });

  it('should not flag lights as stale sensors', async () => {
    const oldDate = new Date(Date.now() - 100 * 60 * 60 * 1000).toISOString();
    const gateway = {
      device: {
        get: fake.resolves([
          {
            name: 'TV LED strip',
            room: { name: 'Living room' },
            features: [
              {
                name: 'Brightness',
                category: DEVICE_FEATURE_CATEGORIES.LIGHT,
                last_value: 50,
                last_value_changed: oldDate,
              },
            ],
          },
        ]),
        energySensorManager: {
          getConsumptionByDates: fake.resolves([]),
        },
      },
      scene: {
        get: fake.resolves([]),
      },
      variable: {
        getValue: fake.resolves('10'),
      },
      energyPrice: {
        getDefaultElectricMeterFeatureId: fake.resolves(null),
      },
    };

    const data = await buildWeeklyDigestData.call(gateway);

    expect(data.stale_sensors).to.have.lengthOf(0);
  });
});

describe('formatSilentDuration', () => {
  it('should format long silences in weeks or months', () => {
    expect(formatSilentDuration(1700)).to.deep.equal({ silent_for_months: 2 });
    expect(formatSilentDuration(100)).to.deep.equal({ silent_for_days: 4 });
    expect(formatSilentDuration(400)).to.deep.equal({ silent_for_weeks: 2 });
  });
});

describe('shouldCheckFeatureForStale', () => {
  it('should reuse MCP sensor feature detection', () => {
    expect(shouldCheckFeatureForStale({ category: DEVICE_FEATURE_CATEGORIES.LIGHT, type: 'binary' })).to.equal(false);
    expect(
      shouldCheckFeatureForStale({
        category: DEVICE_FEATURE_CATEGORIES.CO2_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      }),
    ).to.equal(true);
    expect(
      shouldCheckFeatureForStale({
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.POWER,
      }),
    ).to.equal(true);
    expect(
      shouldCheckFeatureForStale({
        category: DEVICE_FEATURE_CATEGORIES.BATTERY,
        type: DEVICE_FEATURE_TYPES.BATTERY.INTEGER,
      }),
    ).to.equal(false);
  });
});
