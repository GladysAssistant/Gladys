const { expect } = require('chai');
const { fake } = require('sinon');

const {
  buildWeeklyDigestData,
  sumConsumptionValues,
  isConsumptionFeature,
  pickConsumptionFeatureOnDevice,
  getLeafConsumptionCandidates,
  selectEnergyFeaturesForDigest,
  dedupeConsumptionCandidatesByDevice,
  splitMainMeterAndOtherCandidates,
  getMainMeterDeviceId,
  fetchEnergyConsumptionForCandidate,
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

  it('should return null when device has no consumption feature', () => {
    expect(pickConsumptionFeatureOnDevice([])).to.equal(undefined);
    expect(
      pickConsumptionFeatureOnDevice([
        {
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
        },
      ]),
    ).to.equal(undefined);
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

    const candidates = getLeafConsumptionCandidates(devices, 'meter-device');

    expect(candidates).to.have.lengthOf(2);
    expect(candidates.map((candidate) => candidate.device.name)).to.include.members(['Main meter', 'Plug']);
  });

  it('should put all candidates in others when main meter is unknown', () => {
    const candidates = [{ device: { id: 'plug-1' } }, { device: { id: 'plug-2' } }];
    const split = splitMainMeterAndOtherCandidates(candidates, null);

    expect(split.mainMeterCandidates).to.deep.equal([]);
    expect(split.otherCandidates).to.deep.equal(candidates);
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

  it('should fetch energy consumption for one candidate', async () => {
    const context = {
      device: {
        energySensorManager: {
          getConsumptionByDates: fake(async () => [{ values: [{ sum_value: 8 }] }]),
        },
      },
    };

    const result = await fetchEnergyConsumptionForCandidate(
      context,
      {
        device: { name: 'Plug' },
        feature: { name: 'Consumption', selector: 'plug-consumption' },
        role: 'top_consumer_candidate',
      },
      new Date('2026-06-01'),
      new Date('2026-06-08'),
      new Date('2026-05-25'),
    );

    expect(result).to.deep.include({
      device: 'Plug',
      feature: 'Consumption',
      role: 'top_consumer_candidate',
      current_week_total: 8,
      previous_week_total: 8,
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

    const result = await fetchEnergyConsumptionForCandidate(
      context,
      {
        device: { name: 'Plug' },
        feature: { name: 'Consumption', selector: 'plug-consumption' },
        role: 'top_consumer_candidate',
      },
      new Date('2026-06-01'),
      new Date('2026-06-08'),
      new Date('2026-05-25'),
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

    const result = await fetchEnergyConsumptionForCandidate(
      context,
      {
        device: { name: 'Plug' },
        feature: { name: 'Consumption', selector: 'plug-consumption' },
        role: 'top_consumer_candidate',
      },
      new Date('2026-06-01'),
      new Date('2026-06-08'),
      new Date('2026-05-25'),
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
    expect(data.stale_sensors[0].hours_since_update).to.be.greaterThan(48);
  });
});
