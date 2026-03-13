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
  device: {
    get: fake.resolves([]),
  },
};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('TuyaHandler.discoverDevices', () => {
  const tuyaHandler = new TuyaHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
    gladys.event.emit = fake.resolves(null);
    gladys.stateManager.get = fake.returns(null);
    gladys.variable.getValue = fake.resolves('APP_ACCOUNT_UID');
    gladys.device.get = fake.resolves([]);
    tuyaHandler.status = STATUS.CONNECTED;
    tuyaHandler.connector = {
      request: sinon
        .stub()
        .onCall(0)
        .resolves({
          result: [
            {
              name: 'name',
              id: 'uuid',
              product_name: 'model',
              local_key: 'localKey',
              ip: '1.1.1.1',
              online: true,
            },
          ],
        })
        .onCall(1)
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
            category: 'cz',
          },
        })
        .onCall(2)
        .resolves({
          result: {
            local_key: 'localKey',
            ip: '1.1.1.1',
          },
        })
        .onCall(3)
        .resolves({
          result: {
            properties: [{ code: 'switch_1', value: true }],
          },
        })
        .onCall(4)
        .resolves({
          result: {
            model: '{"services":[]}',
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
            name: 'switch_1',
            read_only: false,
            selector: 'tuya:uuid:switch_1',
            type: 'binary',
          },
        ],
        device_type: 'smart-socket',
        model: 'model',
        name: 'name',
        poll_frequency: 30000,
        params: [
          {
            name: 'DEVICE_ID',
            value: 'uuid',
          },
          {
            name: 'LOCAL_KEY',
            value: 'localKey',
          },
          {
            name: 'CLOUD_IP',
            value: '1.1.1.1',
          },
          {
            name: 'LOCAL_OVERRIDE',
            value: false,
          },
        ],
        properties: {
          properties: [{ code: 'switch_1', value: true }],
        },
        product_id: undefined,
        product_key: undefined,
        specifications: {
          details: 'details',
          category: 'cz',
          functions: [
            {
              code: 'switch_1',
              name: 'name',
              type: 'Boolean',
            },
          ],
          status: [
            {
              code: 'cur_power',
              name: 'cur_power',
              type: 'Integer',
            },
          ],
        },
        selector: 'tuya:uuid',
        service_id: 'ffa13430-df93-488a-9733-5c540e9558e0',
        should_poll: true,
        thing_model: {
          services: [],
        },
        tuya_mapping: {
          ignored_cloud_codes: ['countdown', 'countdown_1'],
          ignored_local_dps: ['11'],
        },
        online: true,
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

    assert.callCount(tuyaHandler.connector.request, 5);
  });

  it('should keep local params from existing devices', async () => {
    gladys.stateManager.get = fake.returns({
      external_id: 'tuya:uuid',
      params: [
        { name: 'IP_ADDRESS', value: '2.2.2.2' },
        { name: 'PROTOCOL_VERSION', value: '3.3' },
        { name: 'LOCAL_OVERRIDE', value: true },
      ],
      features: [{ external_id: 'tuya:uuid:cur_power' }, { external_id: 'tuya:uuid:switch_1' }],
    });

    const devices = await tuyaHandler.discoverDevices();
    const { params } = devices[0];
    const getParam = (name) => params.find((param) => param.name === name);

    expect(getParam('IP_ADDRESS').value).to.equal('2.2.2.2');
    expect(getParam('PROTOCOL_VERSION').value).to.equal('3.3');
    expect(getParam('LOCAL_OVERRIDE').value).to.equal(true);
  });

  it('should append existing devices not returned by discovery', async () => {
    gladys.device.get = fake.resolves([
      { external_id: 'tuya:existing', name: 'Existing device', params: [] },
      { name: 'missing external id' },
    ]);

    const devices = await tuyaHandler.discoverDevices();
    const existing = devices.find((device) => device.external_id === 'tuya:existing');

    expect(existing).to.not.equal(undefined);
    expect(existing.updatable).to.equal(false);
  });

  it('should continue when loading existing devices fails', async () => {
    gladys.device.get = fake.rejects(new Error('failure'));

    const devices = await tuyaHandler.discoverDevices();
    expect(devices).to.be.an('array');
    expect(devices.length).to.be.greaterThan(0);
  });
});
