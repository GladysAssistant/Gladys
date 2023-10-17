const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const TuyaHandler = require('../../../../services/tuya/lib/index');
const { STATUS } = require('../../../../services/tuya/lib/utils/tuya.constants');
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

describe('TuyaHandler.discoverDevices', () => {
  const tuyaHandler = new TuyaHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
    tuyaHandler.status = STATUS.CONNECTED;
    tuyaHandler.connector = {
      request: sinon
        .stub()
        .onFirstCall()
        .resolves({ result: { list: [{ name: 'name', id: 'uuid', product_name: 'model' }] } })
        .onSecondCall()
        .resolves({
          result: {
            details: 'details',
            functions: [
              {
                name: 'name',
                code: 'switch_1',
                type: 'Boolean',
              },
            ],
            status: [
              {
                name: 'cur_power',
                code: 'cur_power',
                type: 'Integer',
              },
            ],
          },
        }),
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should fail because service is not ready', async () => {
    tuyaHandler.status = 'unknown';

    try {
      await tuyaHandler.discoverDevices();
      assert.fail();
    } catch (e) {
      expect(e).to.be.instanceOf(ServiceNotConfiguredError);
    }

    assert.calledOnce(gladys.event.emit);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.TUYA.STATUS,
      payload: { status: 'unknown' },
    });

    assert.notCalled(tuyaHandler.connector.request);
  });

  it('should fail because device request fails', async () => {
    tuyaHandler.connector.request = fake.rejects();

    const devices = await tuyaHandler.discoverDevices();
    expect(devices).to.be.lengthOf(0);

    assert.callCount(gladys.event.emit, 2);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.TUYA.STATUS,
      payload: { status: STATUS.DISCOVERING_DEVICES },
    });
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.TUYA.STATUS,
      payload: { status: STATUS.CONNECTED },
    });

    assert.calledOnce(tuyaHandler.connector.request);
  });

  it('should load devices', async () => {
    const devices = await tuyaHandler.discoverDevices();
    expect(devices).to.deep.eq([
      {
        external_id: 'tuya:uuid',
        features: [
          {
            category: 'switch',
            external_id: 'tuya:uuid:cur_power',
            has_feedback: false,
            max: 1,
            min: 0,
            name: 'cur_power',
            read_only: true,
            selector: 'tuya:uuid:cur_power',
            type: 'power',
            unit: 'watt',
          },
          {
            category: 'switch',
            external_id: 'tuya:uuid:switch_1',
            has_feedback: false,
            max: 1,
            min: 0,
            name: 'name',
            read_only: false,
            selector: 'tuya:uuid:switch_1',
            type: 'binary',
          },
        ],
        model: 'model',
        name: 'name',
        poll_frequency: 30000,
        selector: 'tuya:uuid',
        service_id: 'ffa13430-df93-488a-9733-5c540e9558e0',
        should_poll: true,
      },
    ]);

    assert.callCount(gladys.event.emit, 2);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.TUYA.STATUS,
      payload: { status: STATUS.DISCOVERING_DEVICES },
    });
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.TUYA.STATUS,
      payload: { status: STATUS.CONNECTED },
    });

    assert.calledTwice(tuyaHandler.connector.request);
  });
});
