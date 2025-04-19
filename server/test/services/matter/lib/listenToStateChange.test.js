// eslint-disable-next-line import/no-unresolved
const { OnOff, OccupancySensing, IlluminanceMeasurement, TemperatureMeasurement } = require('@matter/main/clusters');

const sinon = require('sinon');

const { fake, assert } = sinon;

const { EVENTS, STATE } = require('../../../../utils/constants');

const MatterHandler = require('../../../../services/matter/lib');

describe('Matter.listenToStateChange', () => {
  let matterHandler;
  let gladys;

  beforeEach(() => {
    gladys = {
      event: {
        emit: fake.returns(null),
      },
    };
    const MatterMain = {};
    const ProjectChipMatter = {};

    matterHandler = new MatterHandler(gladys, MatterMain, ProjectChipMatter, 'service-1');
  });

  it('should listen to state change (ON)', async () => {
    const clusterClients = new Map();
    clusterClients.set(OnOff.Complete.id, {
      addOnOffAttributeListener: (callback) => {
        callback(true);
      },
    });
    const device = {
      number: 1,
      clusterClients,
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:6',
      state: STATE.ON,
    });
  });
  it('should listen to state change (OFF)', async () => {
    const clusterClients = new Map();
    clusterClients.set(OnOff.Complete.id, {
      addOnOffAttributeListener: (callback) => {
        callback(false);
      },
    });
    const device = {
      number: 1,
      clusterClients,
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:6',
      state: STATE.OFF,
    });
  });
  it('should listen to state change in nested child endpoint (OFF)', async () => {
    const clusterClients = new Map();
    clusterClients.set(OnOff.Complete.id, {
      addOnOffAttributeListener: (callback) => {
        callback(false);
      },
    });
    const device = {
      number: 1,
      clusterClients,
    };
    await matterHandler.listenToStateChange(1234n, '1:child_endpoint:2', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:child_endpoint:2:6',
      state: STATE.OFF,
    });
  });
  it('should listen to state change (Occupancy = true)', async () => {
    const clusterClients = new Map();
    clusterClients.set(OccupancySensing.Complete.id, {
      addOccupancyAttributeListener: (callback) => {
        callback({ occupied: true });
      },
    });
    const device = {
      number: 1,
      clusterClients,
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:1030',
      state: STATE.ON,
    });
  });
  it('should listen to state change (Occupancy = false)', async () => {
    const clusterClients = new Map();
    clusterClients.set(OccupancySensing.Complete.id, {
      addOccupancyAttributeListener: (callback) => {
        callback({ occupied: false });
      },
    });
    const device = {
      number: 1,
      clusterClients,
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:1030',
      state: STATE.OFF,
    });
  });
  it('should listen to state change (IlluminanceMeasurement)', async () => {
    const clusterClients = new Map();
    clusterClients.set(IlluminanceMeasurement.Complete.id, {
      addMeasuredValueAttributeListener: (callback) => {
        callback(1000);
      },
    });
    const device = {
      number: 1,
      clusterClients,
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:1024',
      state: 100,
    });
  });
  it('should listen to state change (TemperatureMeasurement)', async () => {
    const clusterClients = new Map();
    clusterClients.set(TemperatureMeasurement.Complete.id, {
      addMeasuredValueAttributeListener: (callback) => {
        callback(2150);
      },
    });
    const device = {
      number: 1,
      clusterClients,
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:1026',
      state: 21.5,
    });
  });
});
