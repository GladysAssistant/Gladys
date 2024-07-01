const { expect } = require('chai');
const EventEmitter = require('events');
const { fake } = require('sinon');
const uuid = require('uuid');

const db = require('../../../models');
const Device = require('../../../lib/device');

const StateManager = require('../../../lib/state');

const event = new EventEmitter();

describe('Device', () => {
  beforeEach(async () => {
    const queryInterface = db.sequelize.getQueryInterface();
    const deviceFeatureStateToInsert = [];
    for (let i = 1; i <= 110; i += 1) {
      const date = new Date();
      deviceFeatureStateToInsert.push({
        id: uuid.v4(),
        device_feature_id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
        value: i,
        created_at: date,
        updated_at: date,
      });
    }
    await queryInterface.bulkInsert('t_device_feature_state', deviceFeatureStateToInsert);
    await db.DeviceFeatureStateAggregate.create({
      type: 'daily',
      device_feature_id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
      value: 12,
    });
    await db.DeviceFeatureStateAggregate.create({
      type: 'hourly',
      device_feature_id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
      value: 12,
    });
    await db.DeviceFeatureStateAggregate.create({
      type: 'monthly',
      device_feature_id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
      value: 12,
    });
  });
  it('should purge all sqlite states', async () => {
    const variable = {
      getValue: fake.resolves(30),
    };
    const stateManager = new StateManager(event);
    const service = {};
    const job = {
      updateProgress: fake.resolves(null),
      wrapper: (type, func) => func,
    };
    const device = new Device(event, {}, stateManager, service, {}, variable, job);
    const devicePurged = await device.purgeAllSqliteStates('632c6d92-a79a-4a38-bf5b-a2024721c101');
    expect(devicePurged).to.deep.equal({
      numberOfDeviceFeatureStateAggregateToDelete: 3,
      numberOfDeviceFeatureStateToDelete: 110,
    });
  });
});
