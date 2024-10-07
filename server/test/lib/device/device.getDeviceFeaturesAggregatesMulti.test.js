const EventEmitter = require('events');
const { expect } = require('chai');
const { fake } = require('sinon');
const db = require('../../../models');
const Device = require('../../../lib/device');
const Job = require('../../../lib/job');

const event = new EventEmitter();
const job = new Job(event);

const insertStates = async (intervalInMinutes) => {
  const deviceFeatureStateToInsert = [];
  const now = new Date();
  const statesToInsert = 2000;
  for (let i = 0; i < statesToInsert; i += 1) {
    const startAt = new Date(now.getTime() - intervalInMinutes * 60 * 1000);
    const date = new Date(startAt.getTime() + ((intervalInMinutes * 60 * 1000) / statesToInsert) * i);
    deviceFeatureStateToInsert.push({
      value: i,
      created_at: date,
    });
  }
  await db.duckDbBatchInsertState('ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4', deviceFeatureStateToInsert);
};

describe('Device.getDeviceFeaturesAggregatesMulti', function Describe() {
  this.timeout(15000);
  beforeEach(async () => {
    const queryInterface = db.sequelize.getQueryInterface();
    await queryInterface.bulkDelete('t_device_feature_state');
    await queryInterface.bulkDelete('t_device_feature_state_aggregate');
    await db.DeviceFeature.update(
      {
        last_monthly_aggregate: null,
        last_daily_aggregate: null,
        last_hourly_aggregate: null,
      },
      { where: {} },
    );
  });
  it('should return last hour states', async () => {
    await insertStates(120);
    const variable = {
      getValue: fake.resolves(null),
    };
    const stateManager = {
      get: fake.returns({
        id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
        name: 'my-feature',
      }),
    };
    const device = new Device(event, {}, stateManager, {}, {}, variable, job);
    const response = await device.getDeviceFeaturesAggregatesMulti(['test-device-feature'], 60, 100);
    expect(response).to.be.instanceOf(Array);
    const { values } = response[0];
    expect(values).to.have.lengthOf(100);
  });
});
