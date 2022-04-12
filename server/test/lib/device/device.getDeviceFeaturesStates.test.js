const EventEmitter = require('events');
const { expect, assert } = require('chai');
const uuid = require('uuid');
const { fake } = require('sinon');
const db = require('../../../models');
const Device = require('../../../lib/device');

const event = new EventEmitter();

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
  this.timeout(15000);

  beforeEach(async () => {
    const queryInterface = db.sequelize.getQueryInterface();
    await queryInterface.bulkDelete('t_device_feature_state');
  });
  it.only('Should return the full 24h existing state of the device feature - with queries "from" and "to" in GMT', async () => {
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
    const dateStateFrom = `${now.getUTCFullYear()}-${`0${now.getUTCMonth() + 1}`.slice(-2)}-${`0${now.getUTCDate() -
      1}`.slice(-2)}`;
    const dateStateTo = `${now.getUTCFullYear()}-${`0${now.getUTCMonth() + 1}`.slice(
      -2,
    )}-${`0${now.getUTCDate()}`.slice(-2)}`;
    const deviceInstance = new Device(event, {}, stateManager, {}, {}, variable);
    const states = await deviceInstance.getDeviceFeaturesStates('test-device-feature', {
      from: new Date(`${dateStateFrom} 00:00:00.000`).toISOString(),
      to: new Date(`${dateStateTo} 23:59:59.999`).toISOString(),
    });
    expect(states).to.have.lengthOf(3 * 60);
    expect(states[0]).to.be.an('object');
    expect(Object.keys(states[0])).to.have.lengthOf(5);
    expect(states[0]).to.have.property('id');
    expect(states[0]).to.have.property('device_feature_id');
    expect(states[0]).to.have.property('value');
    expect(states[0]).to.have.property('created_at');
    expect(states[0]).to.have.property('updated_at');
    expect(states[0].id).to.be.an('string');
    expect(states[0].device_feature_id).to.be.an('string');
    expect(states[0].value).to.be.an('number');
    expect(states[0].created_at).to.be.an('string');
    expect(states[0].updated_at).to.be.an('string');
    expect(new Date(states[0].created_at)).to.be.an('date');
    expect(new Date(states[0].updated_at)).to.be.an('date');
  });
  it.only('should return states between 00:10 and 01:10 with a target between 2000-06-15 00:10 and now using take and skip , only values', async () => {
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
    const dateState = `${now.getUTCFullYear()}-${`0${now.getUTCMonth() + 1}`.slice(-2)}-${`0${now.getUTCDate()}`.slice(
      -2,
    )}`;
    const device = new Device(event, {}, stateManager, {}, {}, variable);
    const states = await device.getDeviceFeaturesStates('test-device-feature', {
      from: new Date(`${dateState}T00:00:00.000Z`).toISOString(),
      attributes: 'value',
      take: 60,
      skip: 10,
    });

    expect(states).to.have.lengthOf(60);
    expect(states[0]).to.be.an('object');
    expect(Object.keys(states[0])).to.have.lengthOf(1);
    expect(states[0]).to.have.property('value');
  });
  it('should return error, device feature doesnt exist', async () => {
    const variable = {
      getValue: fake.resolves(null),
    };
    const stateManager = {
      get: fake.returns(null),
    };
    const dateState = `${now.getUTCFullYear()}-${`0${now.getUTCMonth() + 1}`.slice(-2)}-${`0${now.getUTCDate()}`.slice(
      -2,
    )}`;
    const device = new Device(event, {}, stateManager, {}, {}, variable);
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
    const dateState = `${now.getUTCFullYear()}-${`0${now.getUTCMonth() + 1}`.slice(-2)}-${`0${now.getUTCDate()}`.slice(
      -2,
    )}`;
    const device = new Device(event, {}, stateManager, {}, {}, variable);
    const promise = device.getDeviceFeaturesStates('this-device-does-not-exist', {
      to: new Date(`${dateState}T10:00:00.000Z`).toISOString(),
    });
    return assert.isRejected(promise, 'Start date missing');
  });
});
