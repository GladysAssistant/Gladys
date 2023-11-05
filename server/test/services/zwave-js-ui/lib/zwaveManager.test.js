const sinon = require('sinon');

const { expect } = require('chai');

const { assert, fake, useFakeTimers } = sinon;
const EventEmitter = require('events');

const { CONFIGURATION, DEFAULT } = require('../../../../services/zwave-js-ui/lib/constants');
const ZwaveJSUIManager = require('../../../../services/zwave-js-ui/lib');
const { WEBSOCKET_MESSAGE_TYPES, EVENTS } = require('../../../../utils/constants');

const ZWAVEJSUI_SERVICE_ID = 'ZWAVEJSUI_SERVICE_ID';
const DRIVER_PATH = 'DRIVER_PATH';

const event = {
  emit: fake.resolves(null),
};

const eventMqtt = new EventEmitter();

const mqttClient = Object.assign(eventMqtt, {
  subscribe: fake.resolves(null),
  publish: fake.returns(true),
  end: fake.resolves(true),
  removeAllListeners: fake.resolves(true),
});

const mqtt = {
  connect: fake.returns(mqttClient),
};

describe('zwaveJSUIManager commands', () => {
  let gladys;
  let zwaveJSUIManager;

  before(() => {
    gladys = {
      event,
      service: {
        getService: () => {
          return {
            list: () =>
              Promise.resolve([
                {
                  path: DRIVER_PATH,
                },
              ]),
          };
        },
      },
      variable: {
        getValue: fake.resolves(true),
        setValue: fake.resolves(true),
      },
      system: {
        isDocker: fake.resolves(true),
        getContainers: fake.resolves([]),
      },
    };
    zwaveJSUIManager = new ZwaveJSUIManager(gladys, mqtt, ZWAVEJSUI_SERVICE_ID);
    zwaveJSUIManager.installMqttContainer = Promise.resolve();
    zwaveJSUIManager.installZwaveJSUIContainer = Promise.resolve();
  });

  beforeEach(() => {
    sinon.reset();
    zwaveJSUIManager.mqttExist = false;
    zwaveJSUIManager.mqttRunning = false;
    zwaveJSUIManager.mqttConnected = false;
    zwaveJSUIManager.zwaveJSUIExist = false;
    zwaveJSUIManager.zwaveJSUIRunning = false;
    zwaveJSUIManager.zwaveJSUIConnected = false;
    zwaveJSUIManager.scanInProgress = false;
    zwaveJSUIManager.usbConfigured = false;
  });

  it('should addNode', () => {
    const ADD_NODE_TIMEOUT = 60 * 1000;
    const clock = useFakeTimers();
    zwaveJSUIManager.mqttConnected = true;
    zwaveJSUIManager.mqttClient = mqttClient;

    zwaveJSUIManager.addNode();
    assert.calledWithExactly(
      zwaveJSUIManager.mqttClient.publish,
      `${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/api/startInclusion/set`,
    );

    clock.tick(ADD_NODE_TIMEOUT);
    expect(zwaveJSUIManager.scanInProgress).to.equal(true);
    assert.calledWithExactly(
      zwaveJSUIManager.mqttClient.publish,
      `${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/api/stopInclusion/set`,
    );
    assert.calledWithExactly(
      zwaveJSUIManager.mqttClient.publish,
      `${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/api/getNodes/set`,
      'true',
    );
    clock.restore();
  });

  it('should removeNode', () => {
    const REMOVE_NODE_TIMEOUT = 60 * 1000;
    const clock = useFakeTimers();
    zwaveJSUIManager.mqttConnected = true;
    zwaveJSUIManager.mqttClient = mqttClient;

    zwaveJSUIManager.removeNode();
    assert.calledWithExactly(
      zwaveJSUIManager.mqttClient.publish,
      `${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/api/startExclusion/set`,
    );

    clock.tick(REMOVE_NODE_TIMEOUT);
    expect(zwaveJSUIManager.scanInProgress).to.equal(true);
    assert.calledWithExactly(
      zwaveJSUIManager.mqttClient.publish,
      `${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/api/startExclusion/set`,
    );
    assert.calledWithExactly(
      zwaveJSUIManager.mqttClient.publish,
      `${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/api/getNodes/set`,
      'true',
    );
    clock.restore();
  });

  it('should scanNetwork', () => {
    zwaveJSUIManager.mqttConnected = true;
    zwaveJSUIManager.mqttClient = mqttClient;

    zwaveJSUIManager.scanNetwork();
    assert.calledWithExactly(
      zwaveJSUIManager.mqttClient.publish,
      `${DEFAULT.ROOT}/_CLIENTS/${DEFAULT.ZWAVEJSUI_CLIENT_ID}/api/getNodes/set`,
      'true',
    );
  });

  it('should setValue', () => {
    zwaveJSUIManager.mqttConnected = true;
    zwaveJSUIManager.mqttClient = mqttClient;

    const commandClass = 2;
    const endpoint = 3;
    const property = 'property';
    const device = {
      nodeId: 1,
    };
    const deviceFeature = {
      external_id: `zwave-js-ui:node_id:${device.nodeId}:comclass:${commandClass}:endpoint:${endpoint}:property:${property}`,
    };
    zwaveJSUIManager.setValue(device, deviceFeature, 0);
    assert.calledWithExactly(
      zwaveJSUIManager.mqttClient.publish,
      `${DEFAULT.ROOT}/nodeID_${device.nodeId}/${commandClass}/${endpoint}/${property}/set`,
      '0',
    );
  });

  it('should setValue with property key', () => {
    zwaveJSUIManager.mqttConnected = true;
    zwaveJSUIManager.mqttClient = mqttClient;

    const commandClass = 2;
    const endpoint = 3;
    const property = 'property';
    const propertyKey = 'propertyKey';
    const device = {
      nodeId: 1,
    };
    const deviceFeature = {
      external_id: `zwave-js-ui:node_id:${device.nodeId}:comclass:${commandClass}:endpoint:${endpoint}:property:${property}-${propertyKey}`,
    };
    zwaveJSUIManager.setValue(device, deviceFeature, 0);
    assert.calledWithExactly(
      zwaveJSUIManager.mqttClient.publish,
      `${DEFAULT.ROOT}/nodeID_${device.nodeId}/${commandClass}/${endpoint}/${property}/${propertyKey}/set`,
      '0',
    );
  });

  it('should return Z-Wave status', () => {
    const status = zwaveJSUIManager.getStatus();
    expect(status).to.deep.equal({
      dockerBased: true,
      mqttConnected: false,
      mqttExist: false,
      mqttRunning: false,
      ready: undefined,
      scanInProgress: false,
      usbConfigured: false,
      zwaveJSUIExist: false,
      zwaveJSUIRunning: false,
      zwaveJSUIConnected: false,
    });
  });
});

describe('zwaveJSUIManager events', () => {
  let gladys;
  let zwaveJSUIManager;

  before(() => {
    gladys = {
      event,
      service: {
        getService: fake.resolves({
          list: fake.resolves([DRIVER_PATH]),
        }),
      },
      variable: {
        getValue: (name) => Promise.resolve(CONFIGURATION.EXTERNAL_ZWAVEJSUI ? true : null),
        setValue: (name) => Promise.resolve(null),
      },
    };
    zwaveJSUIManager = new ZwaveJSUIManager(gladys, mqtt, ZWAVEJSUI_SERVICE_ID);
    zwaveJSUIManager.mqttConnected = true;
  });

  beforeEach(() => {
    sinon.reset();
  });

  it('should receive scanComplete', () => {
    zwaveJSUIManager.scanInProgress = true;
    zwaveJSUIManager.scanComplete();
    assert.calledOnceWithExactly(zwaveJSUIManager.eventManager.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.SCAN_COMPLETE,
    });
    expect(zwaveJSUIManager.scanInProgress).to.eq(false);
  });

  it('should receive node ready info', () => {
    const zwaveNode = {
      id: 1,
      manufacturerId: 'manufacturerId',
      deviceId: 'deviceId',
      product: 'product',
      productType: 'productType',
      productId: 'productId',
      type: 'type',
      firmwareVersion: 'firmwareVersion',
      name: 'name',
      loc: 'location',
      status: 'status',
      ready: true,
      nodeType: 'nodeType',
      getDefinedValueIDs: fake.returns([]),
    };
    zwaveJSUIManager.nodes = {
      '1': {
        nodeId: 1,
        classes: {},
        ready: false,
        endpoints: [2],
      },
    };
    zwaveJSUIManager.nodeReady(zwaveNode);
    expect(zwaveJSUIManager.nodes).to.deep.equal({
      '1': {
        nodeId: 1,
        classes: {},
        endpoints: [2],
        product: 'deviceId',
        firmwareVersion: 'firmwareVersion',
        name: 'name',
        loc: 'location',
        status: 'status',
        ready: true,
      },
    });
  });
});
