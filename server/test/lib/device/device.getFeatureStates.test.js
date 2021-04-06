const { Op } = require('sequelize');
const uuid = require('uuid');
const EventEmitter = require('events');
const { expect } = require('chai');

const db = require('../../../models');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');

const event = new EventEmitter();

const stateManager = new StateManager(event);
const service = {};
const device = new Device(event, {}, stateManager, service);

describe.only('Device.getFeatureStates', () => {
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

  it('should getFeatureStates ', async () => {
    const beginDate = new Date();
    beginDate.setDate(beginDate.getDate() - 2);
    beginDate.setHours(0, 0, 0, 0);

    let endDate = new Date();
    endDate.setDate(endDate.getDate() - 1);
    endDate.setHours(0, 0, 0, 0);

    let myAllData = [];
    for (let i = 0; beginDate < endDate; i += 1) {
      myAllData.push({
        id: `${uuid.v4()}`,
        device_feature_id: featureId,
        value: `${Math.floor(Math.random() * 50) + 1}`,
        created_at: `${beginDate.toISOString()}`,
        updated_at: `${beginDate.toISOString()}`,
      });
      beginDate.setMinutes(beginDate.getMinutes() + 14);
    }
    await db.DeviceFeatureStateLight.bulkCreate(myAllData);

    endDate = new Date();
    endDate.setHours(0, 0, 0, 0);
    myAllData = [];
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
    await db.DeviceFeatureState.bulkCreate(myAllData);

    beginDate.setDate(beginDate.getDate() - 1);
    await db.DeviceFeature.update(
      { last_downsampling: beginDate },
      {
        where: {
          id: featureId,
        },
      },
    );
    beginDate.setDate(beginDate.getDate() - 1);

    const params = {
      device_feature_selector: ['test-device-feature'],
      begin_date: beginDate,
      end_date: endDate,
    };
    // Choose attributes
    params.attributes_device = [];
    params.attributes_device.push('name');
    params.attributes_device.push('selector');
    params.attributes_device_feature = [];
    params.attributes_device_feature.push('id');
    params.attributes_device_feature.push('name');
    params.attributes_device_feature.push('selector');
    params.attributes_device_feature.push('unit');
    params.attributes_device_feature.push('last_value');
    params.attributes_device_feature.push('last_value_changed');
    params.attributes_device_feature.push('last_downsampling');
    params.attributes_device_room = [];
    params.attributes_device_room.push('name');
    params.attributes_device_room.push('selector');

    const devices = await device.getFeatureStates(params);

    expect(devices)
      .to.be.instanceOf(Array)
      .and.have.lengthOf(1);

    expect(devices[0].features)
      .to.be.instanceOf(Array)
      .and.have.lengthOf(1);

    expect(devices[0].features[0].device_feature_states)
      .to.be.instanceOf(Array)
      .and.have.lengthOf(1440 + 101);
  });

  it('should getFeatureStates with multi features ', async () => {
    const beginDate = new Date();
    beginDate.setDate(beginDate.getDate() - 2);
    beginDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1);
    endDate.setHours(0, 0, 0, 0);

    const params = {
      device_feature_selector: ['test-device-feature', 'test-device-feature-2'],
      begin_date: beginDate,
      end_date: endDate,
    };
    // Choose attributes
    params.attributes_device = [];
    params.attributes_device.push('name');
    params.attributes_device.push('selector');
    params.attributes_device_feature = [];
    params.attributes_device_feature.push('id');
    params.attributes_device_feature.push('name');
    params.attributes_device_feature.push('selector');
    params.attributes_device_feature.push('unit');
    params.attributes_device_feature.push('last_value');
    params.attributes_device_feature.push('last_value_changed');
    params.attributes_device_feature.push('last_downsampling');
    params.attributes_device_room = [];
    params.attributes_device_room.push('name');
    params.attributes_device_room.push('selector');

    const devices = await device.getFeatureStates(params);

    expect(devices)
      .to.be.instanceOf(Array)
      .and.have.lengthOf(1);

    expect(devices[0].features)
      .to.be.instanceOf(Array)
      .and.have.lengthOf(2);
  });
});
