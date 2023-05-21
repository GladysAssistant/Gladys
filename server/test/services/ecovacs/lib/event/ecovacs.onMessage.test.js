const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');

const { assert } = sinon;
const { EVENTS } = require('../../../../../utils/constants');
const { event, serviceId, devices } = require('../../consts.test');
const EcovacsApiMock = require('../../mocks/ecovacs-api.mock.test');

const EcovacsService = proxyquire('../../../../../services/ecovacs/index', {
  'ecovacs-deebot': EcovacsApiMock,
});

describe('ecovacs.onMessage command', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should update device state with a new battery value when BatteryInfo event is fired', async () => {
    const gladys = { event };
    const ecovacsService = EcovacsService(gladys, serviceId);
    const type = 'BatteryInfo';
    await ecovacsService.device.onMessage(type, devices[0], 10.1);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'ecovacs:5c19a8f3a1e6ee0001782247:battery:0',
      state: 10,
    });
  });
});
