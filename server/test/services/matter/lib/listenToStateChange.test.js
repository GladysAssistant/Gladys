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
    const device = {
      number: 1,
      clusterClients: {
        get: fake.returns({
          addOnOffAttributeListener: (callback) => {
            callback(true);
          },
        }),
      },
    };
    await matterHandler.listenToStateChange(1234n, device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:6',
      state: STATE.ON,
    });
  });
  it('should listen to state change (OFF)', async () => {
    const device = {
      number: 1,
      clusterClients: {
        get: fake.returns({
          addOnOffAttributeListener: (callback) => {
            callback(false);
          },
        }),
      },
    };
    await matterHandler.listenToStateChange(1234n, device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:6',
      state: STATE.OFF,
    });
  });
});
