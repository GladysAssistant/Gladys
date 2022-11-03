const EventEmitter = require('events');
const { expect, assert } = require('chai');
const uuid = require('uuid');
const { fake } = require('sinon');
const db = require('../../../models');
const Device = require('../../../lib/device');
const Job = require('../../../lib/job');

const event = new EventEmitter();
const job = new Job(event);

const now = new Date('2000-06-15T03:59:00.000Z');
const insertStates = async () => {
  const queryInterface = db.sequelize.getQueryInterface();
  const deviceFeatureStateToInsert = [];
  const statesToInsert = 3 * 60;
  for (let i = 0; i < statesToInsert; i += 1) {
    const startAt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const date = new Date(startAt.getTime() + ((3 * 60 * 60 * 1000) / statesToInsert) * i);
    deviceFeatureStateToInsert.push({
      id: uuid.v4(),
      device_feature_id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
      value: i,
      created_at: date,
      updated_at: date,
    });
  }
  await queryInterface.bulkInsert('t_device_feature_state', deviceFeatureStateToInsert);
};

describe('Device.getDeviceFeaturesStates', function Describe() {
  this.timeout(5000);

  afterEach(async () => {
    const queryInterface = db.sequelize.getQueryInterface();
    await queryInterface.bulkDelete('t_device_feature_state');
  });
  it('should return states between 01:10 and 02:09 with a target between 2000-06-15 00:10 and now using take and skip , only created_at and values', async () => {
    await insertStates();
    const variable = {
      getValue: fake.resolves(null),
    };
    const stateManager = {
      get: fake.returns({
        id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
        name: 'my-feature',
      }),
    };
    const dateState = '2000-06-15';
    const device = new Device(event, {}, stateManager, {}, {}, variable, job);
    const states = await device.getDeviceFeaturesStates('test-device-feature', {
      from: new Date(`${dateState}T00:00:00.000Z`).toISOString(),
      attributes: 'created_at,value',
      take: 60,
      skip: 10,
    });
    expect(states).to.have.lengthOf(60);
    expect(Object.keys(states[0])).to.have.lengthOf(2);
    expect(states[0]).to.have.property('value');
    expect(states[0]).to.not.have.own.property('updated_at');
  });
  it('should return error, device feature doesnt exist', async () => {
    const variable = {
      getValue: fake.resolves(null),
    };
    const stateManager = {
      get: fake.returns(null),
    };
    const dateState = '2000-06-15';
    const device = new Device(event, {}, stateManager, {}, {}, variable, job);
    const promise = device.getDeviceFeaturesStates('test-device-feature', {
      from: new Date(`${dateState}T00:00:00.000Z`).toISOString(),
      to: new Date(`${dateState}T10:00:00.000Z`).toISOString(),
    });
    return assert.isRejected(promise, 'DeviceFeature not found');
  });
  it('should return error, start date missing', async () => {
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
    const promise = device.getDeviceFeaturesStates('this-device-does-not-exist', {});
    return assert.isRejected(promise, 'Start date missing');
  });
});
