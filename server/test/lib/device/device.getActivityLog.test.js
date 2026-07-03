const EventEmitter = require('events');
const { expect } = require('chai');
const { fake } = require('sinon');

const db = require('../../../models');
const Device = require('../../../lib/device');
const Job = require('../../../lib/job');

const event = new EventEmitter();
const job = new Job(event);

describe('Device.getActivityLog', function Describe() {
  this.timeout(15000);

  beforeEach(async () => {
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
  });

  it('should return empty array when no features match', async () => {
    const variable = { getValue: fake.resolves(null) };
    const stateManager = { get: fake.returns(null), getAllKeys: fake.returns([]) };
    const deviceInstance = new Device(event, {}, stateManager, {}, {}, variable, job);

    const entries = await deviceInstance.getActivityLog({ take: 10, skip: 0, mode: 'all' });
    expect(entries).to.deep.equal([]);
  });
});
