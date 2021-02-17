const { Op } = require('sequelize');
const uuid = require('uuid');
const EventEmitter = require('events');
const { expect, assert } = require('chai');

const db = require('../../../models');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');

const event = new EventEmitter();
const stateManager = new StateManager(event);
const service = {};
const device = new Device(event, {}, stateManager, service, {}, {});

describe('Device', () => {
  const featureId = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';

  afterEach(() => {
    // Remove value created during test
    const queryInterface = db.sequelize.getQueryInterface();
    queryInterface.bulkDelete('t_device_feature_state_light', {
      device_feature_id: {
        [Op.eq]: featureId,
      },
    });

    queryInterface.bulkDelete('t_device_feature_state', {
      device_feature_id: {
        [Op.eq]: featureId,
      },
    });

    // Reset last_downsampling of DeviceFeature
    db.DeviceFeature.update(
      { last_downsampling: null },
      {
        where: {
          id: featureId,
        },
      },
    );
  });

  it('should downsamplingStates (state > 100 values per day)', async () => {
    const beginDate = new Date();
    beginDate.setDate(beginDate.getDate() - 2);
    beginDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setHours(0, 0, 0, 0);

    const myAllData = [];
    for (let i = 0; beginDate < endDate; i += 1) {
      myAllData.push({
        id: `${uuid.v4()}`,
        device_feature_id: featureId,
        value: `${Math.floor(Math.random() * 50) + 1}`,
        created_at: `${beginDate.toISOString()}`,
        updated_at: `${beginDate.toISOString()}`,
      });
      beginDate.setMinutes(beginDate.getMinutes() + 1);
    }

    db.DeviceFeatureState.bulkCreate(myAllData);

    beginDate.setDate(beginDate.getDate() - 2);
    db.DeviceFeature.update(
      { last_downsampling: beginDate },
      {
        where: {
          id: featureId,
        },
      },
    );

    await device.downsamplingStates();

    const deviceFeatureStates = await db.DeviceFeatureState.findAll({
      where: {
        device_feature_id: { [Op.eq]: featureId },
        created_at: { [Op.between]: [beginDate, endDate] },
      },
      raw: true,
    });

    const deviceFeatureStatesLight = await db.DeviceFeatureStateLight.findAll({
      where: {
        device_feature_id: { [Op.eq]: featureId },
        created_at: { [Op.between]: [beginDate, endDate] },
      },
      raw: true,
    });

    const deviceFeature = await db.DeviceFeature.findAll({
      where: {
        id: { [Op.eq]: featureId },
      },
      raw: true,
    });

    expect(deviceFeatureStates)
      .to.be.instanceOf(Array)
      .and.have.lengthOf(2880);

    expect(deviceFeatureStatesLight)
      .to.be.instanceOf(Array)
      .and.have.lengthOf(200);

    const lastDSTimestamp = new Date(deviceFeature[0].last_downsampling).getTime();
    assert.equal(lastDSTimestamp < endDate.getTime(), true);
  });

  it('should downsamplingStates (state < 100 values)', async () => {
    const beginDate = new Date();
    beginDate.setDate(beginDate.getDate() - 1);
    beginDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    // endDate.setDate(endDate.getDate());
    endDate.setHours(0, 0, 0, 0);

    const myAllData = [];
    for (let i = 0; i < 50; i += 1) {
      beginDate.setMinutes(beginDate.getMinutes() + 1);
      myAllData.push({
        id: `${uuid.v4()}`,
        device_feature_id: featureId,
        value: `${Math.floor(Math.random() * 50) + 1}`,
        created_at: `${beginDate.toISOString()}`,
        updated_at: `${beginDate.toISOString()}`,
      });
    }
    const lastDSTimestampExpected = beginDate.getTime();

    myAllData.forEach((state) => {
      // testDevice.features[0].device_feature_states.push(state);
      db.DeviceFeatureState.create(state);
    });

    await device.downsamplingStates();

    beginDate.setDate(beginDate.getDate() - 1);
    const deviceFeatureStates = await db.DeviceFeatureState.findAll({
      where: {
        device_feature_id: { [Op.eq]: featureId },
        created_at: { [Op.between]: [beginDate, endDate] },
      },
      raw: true,
    });

    const deviceFeatureStatesLight = await db.DeviceFeatureStateLight.findAll({
      where: {
        device_feature_id: { [Op.eq]: featureId },
        created_at: { [Op.between]: [beginDate, endDate] },
      },
      raw: true,
    });

    const deviceFeature = await db.DeviceFeature.findAll({
      where: {
        id: { [Op.eq]: featureId },
      },
      raw: true,
    });

    expect(deviceFeatureStates)
      .to.be.instanceOf(Array)
      .and.have.lengthOf(50);

    expect(deviceFeatureStatesLight)
      .to.be.instanceOf(Array)
      .and.have.lengthOf(50);

    const lastDSTimestamp = new Date(deviceFeature[0].last_downsampling).getTime();
    assert.equal(lastDSTimestamp, lastDSTimestampExpected);
  });
});
