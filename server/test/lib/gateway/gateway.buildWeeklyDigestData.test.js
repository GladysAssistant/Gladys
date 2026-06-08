const { expect } = require('chai');
const { fake } = require('sinon');

const {
  buildWeeklyDigestData,
  sumConsumptionValues,
  getLeafConsumptionCandidates,
  selectEnergyFeaturesForDigest,
  dedupeConsumptionCandidatesByDevice,
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

  it('should prioritize main meter and top consumers by volume', async () => {
    const devices = [
      {
        id: 'meter-device',
        name: 'Main meter',
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
    expect(data.energy[0]).to.include({
      device: 'Main meter',
      role: 'main_meter',
      current_week_total: 120,
    });
    expect(data.energy[1]).to.include({
      device: 'Plug B',
      role: 'top_consumer',
      current_week_total: 30,
    });
    expect(data.energy[2]).to.include({
      device: 'Plug C',
      role: 'top_consumer',
      current_week_total: 15,
    });
    expect(data.energy[3]).to.include({
      device: 'Plug A',
      role: 'top_consumer',
      current_week_total: 5,
    });
  });
});

describe('energy digest helpers', () => {
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

    const candidates = getLeafConsumptionCandidates(devices);

    expect(candidates).to.have.lengthOf(1);
    expect(candidates[0].device.name).to.equal('Lixee TIC');
  });

  it('should keep one consumption feature per device', () => {
    const candidates = dedupeConsumptionCandidatesByDevice([
      {
        device: { id: 'device-1', name: 'Plug' },
        feature: {
          id: 'daily',
          type: DAILY_CONSUMPTION,
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        },
      },
      {
        device: { id: 'device-1', name: 'Plug' },
        feature: {
          id: 'thirty',
          type: THIRTY_MINUTES_CONSUMPTION,
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        },
      },
    ]);

    expect(candidates).to.have.lengthOf(1);
    expect(candidates[0].feature.id).to.equal('thirty');
  });

  it('should always include main meter before top consumer candidates', () => {
    const selected = selectEnergyFeaturesForDigest(
      [
        {
          id: 'plug-1',
          name: 'Plug 1',
          features: [
            {
              id: 'plug-feature',
              selector: 'plug-1',
              category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
              type: DAILY_CONSUMPTION,
            },
          ],
        },
        {
          id: 'meter-1',
          name: 'Meter',
          features: [
            {
              id: 'meter-feature',
              selector: 'meter-1',
              category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
              type: DAILY_CONSUMPTION,
            },
          ],
        },
      ],
      'meter-1',
    );

    expect(selected[0].role).to.equal('main_meter');
    expect(selected[0].device.name).to.equal('Meter');
    expect(selected[1].role).to.equal('top_consumer_candidate');
    expect(selected[1].device.name).to.equal('Plug 1');
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
});
