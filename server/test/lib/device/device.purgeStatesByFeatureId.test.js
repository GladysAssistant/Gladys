const { expect } = require('chai');
const EventEmitter = require('events');

const Device = require('../../../lib/device');
const db = require('../../../models');
const StateManager = require('../../../lib/state');

const event = new EventEmitter();

describe('device.purgeStatesByFeatureId', () => {
  beforeEach(async () => {
    await db.DeviceFeatureState.create({
      device_feature_id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
      value: 12,
    });
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
    const device = new Device(event, {}, stateManager, service, {}, {});
    await device.purgeStatesByFeatureId('ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4');
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
