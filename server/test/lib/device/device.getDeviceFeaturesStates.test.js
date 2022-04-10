const EventEmitter = require('events');
const { expect, assert } = require('chai');
const uuid = require('uuid');
const { fake } = require('sinon');
const db = require('../../../models');
const Device = require('../../../lib/device');

const event = new EventEmitter();

const now = new Date('2000-06-15 23:59:00.000');
const insertStates = async () => {
  const queryInterface = db.sequelize.getQueryInterface();
  const deviceFeatureStateToInsert = [];
  const statesToInsert = 23 * 60 + 59;
  for (let i = 0; i < statesToInsert; i += 1) {
    const startAt = new Date(now.getTime() - (24 * 60) * 60 * 1000);
    const date = new Date(startAt.getTime() + (((24 * 60) * 60 * 1000) / statesToInsert) * i);
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
  it('should return the current states', async () => {
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
    const deviceInstance = new Device(event, {}, stateManager, {}, {}, variable);
    const states = await deviceInstance.getDeviceFeaturesStates(
      'test-device-feature',
      {
        from: new Date(`${dateState} 00:00:00.000`).toISOString(),
        to: new Date(`${dateState} 23:59:59.999`).toISOString()
      }
    );
    expect(states).to.have.lengthOf((23 * 60 + 59)-1);
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
  it('should return states between 00:01 and 01:30 only values, created_at and device_feature_id', async () => {
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
    const states = await device.getDeviceFeaturesStates(
      'test-device-feature',
      {
        from: new Date(`${dateState}T00:01:00.000Z`).toISOString(),
        to: new Date(`${dateState}T01:30:00.000Z`).toISOString(),
        attributes : 'value,created_at,device_feature_id'
      }
    );
    
    expect(states).to.have.lengthOf(90 - 1);
    expect(states[0]).to.be.an('object');
    expect(Object.keys(states[0])).to.have.lengthOf(3);
    expect(states[0]).to.have.property('value');
    expect(states[0]).to.have.property('created_at');
    expect(states[0]).to.have.property('device_feature_id');
    const firstDateState = new Date(states[0].created_at);
    const lastDateState = new Date(states[states.length-1].created_at);
    expect(firstDateState.getUTCHours()).to.equal(0);
    expect(firstDateState.getUTCMinutes()).to.equal(1);
    expect(lastDateState.getUTCHours()).to.equal(1);
    expect(lastDateState.getUTCMinutes()).to.equal(29);
  });
  it('should return states between 00:10 and 01:10 with a target between 2000-06-15 00:10 and now using take and skip , only values', async () => {
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
    const states = await device.getDeviceFeaturesStates(
      'test-device-feature',
      {
        from: new Date(`${dateState}T00:00:00.000Z`).toISOString(),
        attributes : 'value',
        take : 60,
        skip : 10,
      }
    );
    
    expect(states).to.have.lengthOf(60);
    expect(states[0]).to.be.an('object');
    expect(Object.keys(states[0])).to.have.lengthOf(1);
    expect(states[0]).to.have.property('value');
    expect(states[0].value).to.equal(120+10+1);
    expect(states[states.length-1].value).to.equal(120+10+60);
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
    const promise = device.getDeviceFeaturesStates(
      'test-device-feature',
      {
        from: new Date(`${dateState}T00:00:00.000Z`).toISOString(),
        to: new Date(`${dateState}T10:00:00.000Z`).toISOString(),
      }
    );
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
    const promise = device.getDeviceFeaturesStates(
      'this-device-does-not-exist',
      {
        to: new Date(`${dateState}T10:00:00.000Z`).toISOString(),
      }
    );
    return assert.isRejected(promise, 'Start date missing');
  });
});
