const { expect } = require('chai');
const { fake } = require('sinon');

const { buildWeeklyDigestData, sumConsumptionValues } = require('../../../lib/gateway/gateway.buildWeeklyDigestData');
const { DEVICE_FEATURE_CATEGORIES } = require('../../../utils/constants');

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
    };

    const data = await buildWeeklyDigestData.call(gateway);

    expect(data.summary.device_count).to.equal(1);
    expect(data.summary.scene_count).to.equal(1);
    expect(data.temperatures).to.have.lengthOf(1);
    expect(data.low_batteries).to.have.lengthOf(1);
    expect(data.recent_scenes).to.have.lengthOf(1);
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
