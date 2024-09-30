const { expect } = require('chai');
const EventEmitter = require('events');
const { fake } = require('sinon');
const db = require('../../../models');

const Device = require('../../../lib/device');

const StateManager = require('../../../lib/state');
const Job = require('../../../lib/job');

const event = new EventEmitter();
const job = new Job(event);

describe('Device', () => {
  it('should purgeStates', async () => {
    const variable = {
      getValue: fake.resolves(30),
    };
    const currentDate = new Date();
    const fortyDaysAgo = new Date(currentDate);
    fortyDaysAgo.setDate(currentDate.getDate() - 40);
    await db.duckDbBatchInsertState('ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4', [
      {
        value: 1,
        created_at: fortyDaysAgo,
      },
      {
        value: 10,
        created_at: currentDate,
      },
    ]);
    const stateManager = new StateManager(event);
    const service = {};
    const device = new Device(event, {}, stateManager, service, {}, variable, job);
    const devicePurged = await device.purgeStates();
    expect(devicePurged).to.equal(true);
    const res = await db.duckDbReadConnectionAllAsync(
      'SELECT value FROM t_device_feature_state WHERE device_feature_id = ?',
      'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
    );
    expect(res).to.deep.equal([{ value: 10 }]);
  });
  it('should not purgeStates, invalid date', async () => {
    const variable = {
      getValue: fake.resolves('NOT A DATE'),
    };
    const stateManager = new StateManager(event);
    const service = {};
    const device = new Device(event, {}, stateManager, service, {}, variable, job);
    const devicePurged = await device.purgeStates();
    expect(devicePurged).to.equal(false);
  });
  it('should not purgeStates, date = -1', async () => {
    const variable = {
      getValue: fake.resolves('-1'),
    };
    const stateManager = new StateManager(event);
    const service = {};
    const device = new Device(event, {}, stateManager, service, {}, variable, job);
    const devicePurged = await device.purgeStates();
    expect(devicePurged).to.equal(false);
  });
});
