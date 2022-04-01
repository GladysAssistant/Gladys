const EventEmitter = require('events');
const { expect } = require('chai');
const uuid = require('uuid');
const { fake } = require('sinon');
const db = require('../../../models');
const Device = require('../../../lib/device');

const event = new EventEmitter();

const insertStates = async (intervalInMinutes) => {
  const queryInterface = db.sequelize.getQueryInterface();
  const deviceFeatureStateToInsert = [];
  const now = new Date();
  const statesToInsert = 2000;
  for (let i = 0; i < statesToInsert; i += 1) {
    const startAt = new Date(now.getTime() - intervalInMinutes * 60 * 1000);
    const date = new Date(startAt.getTime() + ((intervalInMinutes * 60 * 1000) / statesToInsert) * i);
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

describe('Device.getDeviceFeaturesStatesMulti', function Describe() {
  this.timeout(15000);
  beforeEach(async () => {
    const queryInterface = db.sequelize.getQueryInterface();
    await queryInterface.bulkDelete('t_device_feature_state');
  });
  it('should return last hour states', async () => {
    await insertStates(1);
    const variable = {
      getValue: fake.resolves(null),
    };
    const stateManager = {
      get: fake.returns({
        id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
        name: 'my-feature',
      }),
    };
    const now = new Date();
    const dateState = `${now.getUTCFullYear()}-${`0${now.getUTCMonth() + 1}`.slice(-2)}-${`0${now.getUTCDate()}`.slice(
      -2,
    )}`;
    const device = new Device(event, {}, stateManager, {}, {}, variable);
    const response = await device.getDeviceFeaturesStatesMulti(
      ['test-device-feature'],
      new Date(`${dateState}T00:00:00.000Z`).toISOString(),
      new Date(`${dateState}T23:59:59.999Z`).toISOString(),
      100,
    );
    expect(response).to.be.instanceOf(Array);
    const { dataRaw } = response[0];
    expect(dataRaw).to.have.lengthOf(2000);
  });
});
