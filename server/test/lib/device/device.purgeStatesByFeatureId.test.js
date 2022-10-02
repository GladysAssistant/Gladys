const { expect } = require('chai');
const EventEmitter = require('events');
const uuid = require('uuid');

const Device = require('../../../lib/device');
const db = require('../../../models');
const StateManager = require('../../../lib/state');
const Job = require('../../../lib/job');

const event = new EventEmitter();

describe('device.purgeStatesByFeatureId', async function Describe() {
  this.timeout(5000);
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
  it('should purge states of a specific feature id', async () => {
    const stateManager = new StateManager(event);
    const service = {};
    const job = new Job(event);
    const device = new Device(event, {}, stateManager, service, {}, {}, job);
    device.STATES_TO_PURGE_PER_DEVICE_FEATURE_CLEAN_BATCH = 1;
    device.WAIT_TIME_BETWEEN_DEVICE_FEATURE_CLEAN_BATCH = 1;
    const res = await device.purgeStatesByFeatureId('ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4');
    expect(res).to.deep.equal({
      numberOfDeviceFeatureStateToDelete: 110,
      numberOfDeviceFeatureStateAggregateToDelete: 3,
    });
    const states = await db.DeviceFeatureState.findAll({
      where: {
        device_feature_id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
      },
    });
    expect(states).to.have.lengthOf(0);
    const statesAggregates = await db.DeviceFeatureStateAggregate.findAll({
      where: {
        device_feature_id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
      },
    });
    expect(statesAggregates).to.have.lengthOf(0);
  });
});
