const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const MELCloudHandler = require('../../../../services/melcloud/lib/index');
const { STATUS } = require('../../../../services/melcloud/lib/utils/melcloud.constants');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

const gladys = {
  event: {
    emit: fake.resolves(null),
  },
  stateManager: {
    get: fake.returns(null),
  },
  variable: {
    getValue: fake.resolves('APP_ACCOUNT_UID'),
  },
};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

const client = {
  get: fake.resolves(null),
};

describe('MELCloudHandler.discoverDevices', () => {
  const melcloudHandler = new MELCloudHandler(gladys, serviceId, client);

  beforeEach(() => {
    sinon.reset();
    melcloudHandler.status = STATUS.CONNECTED;
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should fail because service is not ready', async () => {
    melcloudHandler.status = 'unknown';

    try {
      await melcloudHandler.discoverDevices();
      assert.fail();
    } catch (e) {
      expect(e).to.be.instanceOf(ServiceNotConfiguredError);
    }

    assert.calledOnce(gladys.event.emit);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MELCLOUD.STATUS,
      payload: { status: 'unknown' },
    });

    assert.notCalled(melcloudHandler.client.get);
  });

  it('should fail because device request fails', async () => {
    melcloudHandler.client.get = fake.rejects();

    const devices = await melcloudHandler.discoverDevices();
    expect(devices).to.be.lengthOf(0);

    assert.callCount(gladys.event.emit, 2);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MELCLOUD.STATUS,
      payload: { status: STATUS.DISCOVERING_DEVICES },
    });
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MELCLOUD.STATUS,
      payload: { status: STATUS.CONNECTED },
    });

    assert.calledOnce(melcloudHandler.client.get);
  });

  it('should load devices', async () => {
    client.get = fake.resolves({
      data: [
        {
          Structure: {
            Devices: [
              {
                DeviceID: 'uuid',
                DeviceName: 'name',
                BuildingID: 'building_uuid',
                Device: {
                  DeviceType: 1,
                  Units: [
                    {
                      Model: 'model',
                    },
                  ],
                },
              },
              {
                DeviceID: 'uuid',
                DeviceName: 'name',
                BuildingID: 'building_uuid',
                Device: {
                  DeviceType: 1,
                  Units: [],
                },
              },
            ],
            Areas: [],
            Floors: [
              {
                Devices: [],
                Areas: [],
              },
            ],
          },
        },
      ],
    });

    const devices = await melcloudHandler.discoverDevices();
    expect(devices).to.deep.eq([
      {
        external_id: 'melcloud:uuid',
        features: [],
        model: 'model',
        name: 'name',
        params: [
          {
            name: 'buildingID',
            value: 'building_uuid',
          },
        ],
        poll_frequency: 10000,
        selector: 'melcloud:uuid',
        service_id: 'ffa13430-df93-488a-9733-5c540e9558e0',
        should_poll: true,
      },
      {
        external_id: 'melcloud:uuid',
        features: [],
        model: null,
        name: 'name',
        params: [
          {
            name: 'buildingID',
            value: 'building_uuid',
          },
        ],
        poll_frequency: 10000,
        selector: 'melcloud:uuid',
        service_id: 'ffa13430-df93-488a-9733-5c540e9558e0',
        should_poll: true,
      },
    ]);

    assert.callCount(gladys.event.emit, 2);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MELCLOUD.STATUS,
      payload: { status: STATUS.DISCOVERING_DEVICES },
    });
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MELCLOUD.STATUS,
      payload: { status: STATUS.CONNECTED },
    });

    assert.calledOnce(melcloudHandler.client.get);
  });
});
