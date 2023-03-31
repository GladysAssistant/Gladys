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
      inclusionState: undefined,
      isScanNetworkActive: undefined,
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

  it('should return no-feature node', () => {
    zwaveJSUIManager.mqttConnected = true;
    zwaveJSUIManager.nodes = {
      '1': {
        nodeId: 1,
        endpoints: [], // No split
        manufacturerId: 'manufacturerId',
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
        classes: {},
      },
    };
    const nodes = zwaveJSUIManager.getNodes();
    expect(nodes).to.deep.equal([
      {
        name: 'name - 1',
        model: 'product firmwareVersion',
        service_id: 'ZWAVEJSUI_SERVICE_ID',
        external_id: 'zwave-js-ui:node_id:1',
        selector: 'zwave-js-ui-node-1-name-1',
        ready: true,
        rawZwaveNode: {
          id: 1,
          loc: 'location',
          product: 'product',
          keysClasses: [],
        },
        features: [],
        params: [],
      },
    ]);
  });

  it('should updateConfiguration', () => {
    const configuration = {
      externalZwaveJSUI: false,
      driverPath: 'driverPath',
      mqttUrl: 'mqttUrl',
      mqttUsername: 'mqttUsername',
      mqttPassword: 'mqttPassword',
      mqttTopicPrefix: 'mqttTopicPrefix',
      mqttTopicWithLocation: true,
      s2UnauthenticatedKey: 's2UnauthenticatedKey',
      s2AuthenticatedKey: 's2AuthenticatedKey',
      s2AccessControlKey: 's2AccessControlKey',
      s0LegacyKey: 's0LegacyKey',
    };

    const setValueStub = sinon.stub();
    setValueStub.returns(true);
    zwaveJSUIManager.gladys.variable.setValue = setValueStub;

    zwaveJSUIManager.updateConfiguration(configuration);

    setValueStub.calledOnceWith(CONFIGURATION.EXTERNAL_ZWAVEJSUI, '1', ZWAVEJSUI_SERVICE_ID);

    setValueStub.calledOnceWith(CONFIGURATION.DRIVER_PATH, 'driverPath', ZWAVEJSUI_SERVICE_ID);

    setValueStub.calledOnceWith(
      CONFIGURATION.ZWAVEJSUI_MQTT_URL,
      DEFAULT.ZWAVEJSUI_MQTT_URL_VALUE,
      ZWAVEJSUI_SERVICE_ID,
    );

    setValueStub.calledOnceWith(
      CONFIGURATION.ZWAVEJSUI_MQTT_USERNAME,
      DEFAULT.ZWAVEJSUI_MQTT_USERNAME_VALUE,
      ZWAVEJSUI_SERVICE_ID,
    );

    setValueStub.calledOnceWith(CONFIGURATION.ZWAVEJSUI_MQTT_PASSWORD, 'mqttPassword', ZWAVEJSUI_SERVICE_ID);

    setValueStub.calledOnceWith(CONFIGURATION.S2_UNAUTHENTICATED, 's2UnauthenticatedKey', ZWAVEJSUI_SERVICE_ID);

    setValueStub.calledOnceWith(CONFIGURATION.S2_AUTHENTICATED, 's2AuthenticatedKey', ZWAVEJSUI_SERVICE_ID);

    setValueStub.calledOnceWith(CONFIGURATION.S2_ACCESS_CONTROL, 's2AccessControlKey', ZWAVEJSUI_SERVICE_ID);

    setValueStub.calledOnceWith(CONFIGURATION.S0_LEGACY, 's0LegacyKey', ZWAVEJSUI_SERVICE_ID);
  });

  it('should updateConfiguration external', () => {
    const configuration = {
      externalZwaveJSUI: true,
      driverPath: 'driverPath',
      mqttUrl: 'mqttUrl',
      mqttUsername: 'mqttUsername',
      mqttPassword: 'mqttPassword',
      mqttTopicPrefix: 'mqttTopicPrefix',
      mqttTopicWithLocation: true,
      s2UnauthenticatedKey: 's2UnauthenticatedKey',
      s2AuthenticatedKey: 's2AuthenticatedKey',
      s2AccessControlKey: 's2AccessControlKey',
      s0LegacyKey: 's0LegacyKey',
    };

    const setValueStub = sinon.stub();
    setValueStub.returns(true);
    zwaveJSUIManager.gladys.variable.setValue = setValueStub;

    zwaveJSUIManager.updateConfiguration(configuration);

    setValueStub.calledOnceWith(CONFIGURATION.EXTERNAL_ZWAVEJSUI, '1', ZWAVEJSUI_SERVICE_ID);

    setValueStub.calledOnceWith(CONFIGURATION.ZWAVEJSUI_MQTT_URL, 'mqttUrl', ZWAVEJSUI_SERVICE_ID);

    setValueStub.calledOnceWith(CONFIGURATION.ZWAVEJSUI_MQTT_USERNAME, 'mqttUsername', ZWAVEJSUI_SERVICE_ID);

    setValueStub.calledOnceWith(CONFIGURATION.ZWAVEJSUI_MQTT_PASSWORD, 'mqttPassword', ZWAVEJSUI_SERVICE_ID);

    setValueStub.calledOnceWith(CONFIGURATION.ZWAVEJSUI_MQTT_TOPIC_PREFIX, 'mqttTopicPrefix', ZWAVEJSUI_SERVICE_ID);

    setValueStub.calledOnceWith(CONFIGURATION.ZWAVEJSUI_MQTT_TOPIC_WITH_LOCATION, '1', ZWAVEJSUI_SERVICE_ID);
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

  it('should receive notification', () => {
    const zwaveNode = {
      id: 1,
    };
    zwaveJSUIManager.notification(zwaveNode, {}, []);
  });

  it('should receive scanComplete', () => {
    zwaveJSUIManager.scanComplete();
    assert.calledOnceWithExactly(zwaveJSUIManager.eventManager.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.SCAN_COMPLETE,
    });
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
    assert.calledOnceWithExactly(zwaveJSUIManager.eventManager.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVEJSUI.NODE_READY,
      payload: {
        nodeId: 1,
        name: 'name',
        status: 'status',
      },
    });
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

describe('zwaveJSUIManager devices', () => {
  let gladys;
  let zwaveJSUIManager;

  before(() => {
    gladys = {};
    zwaveJSUIManager = new ZwaveJSUIManager(gladys, mqtt, ZWAVEJSUI_SERVICE_ID);
    zwaveJSUIManager.mqttConnected = true;
  });

  it('should receive node without feature/params', () => {
    zwaveJSUIManager.nodes = {
      '1': {
        nodeId: 1,
        endpoints: [],
        manufacturerId: 'manufacturerId',
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
        classes: {},
      },
    };
    const devices = zwaveJSUIManager.getNodes();
    expect(devices).to.deep.equal([
      {
        service_id: ZWAVEJSUI_SERVICE_ID,
        external_id: 'zwave-js-ui:node_id:1',
        model: 'product firmwareVersion',
        name: 'name - 1',
        ready: true,
        selector: 'zwave-js-ui-node-1-name-1',
        features: [],
        params: [],
        rawZwaveNode: {
          id: 1,
          loc: 'location',
          product: 'product',
          keysClasses: [],
        },
      },
    ]);
  });

  it('should receive node with param', () => {
    zwaveJSUIManager.nodes = {
      '1': {
        nodeId: 1,
        endpoints: [],
        manufacturerId: 'manufacturerId',
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
        classes: {
          112: {
            0: {
              'Parameter 1': {
                genre: 'config',
                label: 'label',
                value_id: 'value_id',
                value: 'value',
              },
            },
          },
        },
      },
    };
    const devices = zwaveJSUIManager.getNodes();
    expect(devices).to.deep.equal([
      {
        service_id: ZWAVEJSUI_SERVICE_ID,
        external_id: 'zwave-js-ui:node_id:1',
        model: 'product firmwareVersion',
        name: 'name - 1',
        ready: true,
        selector: 'zwave-js-ui-node-1-name-1',
        features: [],
        params: [
          {
            name: '0-label-value-id',
            value: 'value',
          },
        ],
        rawZwaveNode: {
          id: 1,
          loc: 'location',
          product: 'product',
          keysClasses: ['112'],
        },
      },
    ]);
  });

  it('should receive node feature Temperature', () => {
    zwaveJSUIManager.nodes = {
      1: {
        nodeId: 1,
        endpoints: [],
        manufacturerId: 'manufacturerId',
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
        classes: {
          49: {
            0: {
              'Air temperature': {
                genre: 'user',
                label: 'label',
                min: -20,
                max: 40,
                unit: '°C',
                readOnly: true,
                commandClass: 49,
                endpoint: 0,
                property: 'Air temperature',
              },
            },
          },
        },
      },
    };
    const devices = zwaveJSUIManager.getNodes();
    expect(devices).to.deep.equal([
      {
        service_id: ZWAVEJSUI_SERVICE_ID,
        external_id: 'zwave-js-ui:node_id:1',
        selector: 'zwave-js-ui-node-1-name-1',
        model: 'product firmwareVersion',
        name: 'name - 1',
        ready: true,
        features: [
          {
            name: 'label',
            selector: 'zwave-js-ui-node-1-air-temperature-49-0-label',
            category: 'temperature-sensor',
            type: 'decimal',
            external_id: 'zwave-js-ui:node_id:1:comclass:49:endpoint:0:property:Air temperature',
            read_only: true,
            unit: 'celsius',
            has_feedback: true,
            last_value: undefined,
            min: -20,
            max: 40,
          },
        ],
        params: [],
        rawZwaveNode: {
          id: 1,
          loc: 'location',
          product: 'product',
          keysClasses: ['49'],
        },
      },
    ]);
  });

  it('should receive 3 nodes feature Switch', () => {
    zwaveJSUIManager.nodes = {
      1: {
        nodeId: 1,
        endpoints: [
          {
            index: 1,
          },
          {
            index: 2,
          },
        ],
        manufacturerId: 'manufacturerId',
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
        classes: {
          37: {
            0: {
              targetValue: {
                genre: 'user',
                label: 'label',
                min: 0,
                max: 1,
                readOnly: false,
                commandClass: 37,
                endpoint: 0,
                property: 'targetValue',
              },
            },
            1: {
              targetValue: {
                genre: 'user',
                label: 'label',
                min: 0,
                max: 1,
                readOnly: false,
                commandClass: 37,
                endpoint: 1,
                property: 'targetValue',
              },
            },
            2: {
              targetValue: {
                genre: 'user',
                label: 'label',
                min: 0,
                max: 1,
                readOnly: false,
                commandClass: 37,
                endpoint: 2,
                property: 'targetValue',
              },
            },
          },
        },
      },
    };
    const devices = zwaveJSUIManager.getNodes();
    expect(devices).to.deep.equal([
      {
        service_id: ZWAVEJSUI_SERVICE_ID,
        external_id: 'zwave-js-ui:node_id:1',
        model: 'product firmwareVersion',
        name: 'name - 1',
        selector: 'zwave-js-ui-node-1-name-1',
        ready: true,
        features: [
          {
            name: 'label',
            selector: 'zwave-js-ui-node-1-targetvalue-37-0-label',
            category: 'switch',
            type: 'binary',
            external_id: 'zwave-js-ui:node_id:1:comclass:37:endpoint:0:property:targetValue',
            read_only: true,
            has_feedback: true,
            last_value: 0,
            min: 0,
            max: 1,
            unit: null,
          },
        ],
        params: [],
        rawZwaveNode: {
          id: 1,
          loc: 'location',
          product: 'product',
          keysClasses: ['37'],
        },
      },
      {
        service_id: ZWAVEJSUI_SERVICE_ID,
        external_id: 'zwave-js-ui:node_id:1_1',
        model: 'product firmwareVersion',
        name: 'name - 1 [1]',
        selector: 'zwave-js-ui-node-1-name-1-1',
        ready: true,
        features: [
          {
            name: 'label [1]',
            selector: 'zwave-js-ui-node-1-targetvalue-37-1-label',
            category: 'switch',
            type: 'binary',
            external_id: 'zwave-js-ui:node_id:1:comclass:37:endpoint:1:property:targetValue',
            read_only: true,
            has_feedback: true,
            last_value: 0,
            min: 0,
            max: 1,
            unit: null,
          },
        ],
        params: [],
        rawZwaveNode: {
          id: 1,
          loc: 'location',
          product: 'product',
          keysClasses: ['37'],
        },
      },
      {
        service_id: ZWAVEJSUI_SERVICE_ID,
        external_id: 'zwave-js-ui:node_id:1_2',
        name: 'name - 1 [2]',
        model: 'product firmwareVersion',
        selector: 'zwave-js-ui-node-1-name-1-2',
        ready: true,
        features: [
          {
            name: 'label [2]',
            selector: 'zwave-js-ui-node-1-targetvalue-37-2-label',
            category: 'switch',
            type: 'binary',
            external_id: 'zwave-js-ui:node_id:1:comclass:37:endpoint:2:property:targetValue',
            read_only: true,
            has_feedback: true,
            last_value: 0,
            min: 0,
            max: 1,
            unit: null,
          },
        ],
        params: [],
        rawZwaveNode: {
          id: 1,
          loc: 'location',
          product: 'product',
          keysClasses: ['37'],
        },
      },
    ]);
  });

  it('should receive node feature Motion 113', () => {
    zwaveJSUIManager.nodes = {
      1: {
        nodeId: 1,
        endpoints: [],
        manufacturerId: 'manufacturerId',
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
        classes: {
          113: {
            0: {
              'Home Security-Motion sensor status': {
                genre: 'user',
                label: 'label',
                readOnly: true,
                commandClass: 113,
                endpoint: 0,
                property: 'Home Security-Motion sensor status',
              },
            },
          },
        },
      },
    };
    const devices = zwaveJSUIManager.getNodes();
    expect(devices).to.deep.equal([
      {
        service_id: ZWAVEJSUI_SERVICE_ID,
        external_id: 'zwave-js-ui:node_id:1',
        selector: 'zwave-js-ui-node-1-name-1',
        model: 'product firmwareVersion',
        name: 'name - 1',
        ready: true,
        features: [
          {
            name: 'Détecteur de présence',
            selector: 'zwave-js-ui-node-1-home-security-motion-sensor-status-113-0-label',
            category: 'motion-sensor',
            external_id: 'zwave-js-ui:node_id:1:comclass:113:endpoint:0:property:Home Security-Motion sensor status',
            type: 'binary',
            min: undefined,
            max: undefined,
            unit: null,
            read_only: true,
            has_feedback: true,
            last_value: undefined,
          },
        ],
        params: [],
        rawZwaveNode: {
          id: 1,
          loc: 'location',
          product: 'product',
          keysClasses: ['113'],
        },
      },
    ]);
  });
});
