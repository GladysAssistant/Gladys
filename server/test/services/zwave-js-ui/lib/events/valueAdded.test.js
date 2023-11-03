const sinon = require('sinon');

const { expect } = require('chai');

const { stub, fake, assert } = sinon;
const EventEmitter = require('events');

const ZwaveJSUIManager = require('../../../../../services/zwave-js-ui/lib');
const { CONFIGURATION } = require('../../../../../services/zwave-js-ui/lib/constants');
const { EVENTS } = require('../../../../../utils/constants');

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

describe('zwaveJSUIManager valueAdded', () => {
  let gladys;
  let zwaveJSUIManager;
  let zwaveNode;

  before(() => {
    gladys = {
      event,
      user: {
        get: stub().resolves([{ id: ZWAVEJSUI_SERVICE_ID }]),
      },
      service: {
        getService: stub().resolves({
          list: Promise.resolve([DRIVER_PATH]),
        }),
      },
      variable: {
        getValue: (name) => Promise.resolve(CONFIGURATION.EXTERNAL_ZWAVEJSUI ? true : null),
        setValue: (name) => Promise.resolve(null),
      },
      stateManager: {
        get: (name, value) => fake.returns(value),
      },
    };
    zwaveJSUIManager = new ZwaveJSUIManager(gladys, mqtt, ZWAVEJSUI_SERVICE_ID);

    zwaveNode = {
      id: 1,
    };
  });

  beforeEach(() => {
    sinon.reset();

    zwaveJSUIManager.mqttConnected = true;
    zwaveJSUIManager.nodes = {
      '1': {
        nodeId: 1,
        name: 'name',
        ready: true,
        classes: {},
        endpoints: [],
        type: 'type',
        product: 'product',
        keysClasses: [],
      },
    };
  });

  it('should handle unknown node', () => {
    zwaveJSUIManager.valueAdded(
      {
        id: 999,
      },
      {
        commandClass: 20,
        endpoint: 0,
        property: 'property',
      },
    );
    expect(zwaveJSUIManager.nodes[1].classes).to.be.empty; // eslint-disable-line
    assert.notCalled(zwaveJSUIManager.eventManager.emit);
  });

  it('should handle value added 37-0-currentValue', () => {
    zwaveJSUIManager.valueAdded(zwaveNode, {
      commandClass: 37,
      endpoint: 0,
      property: 'currentValue',
      type: 'boolean',
      label: 'Current value',
      min: 0,
      max: 99,
      writeable: false,
    });
    expect(zwaveJSUIManager.nodes[1].classes[37][0].targetValue).to.deep.equal({
      commandClass: 37,
      endpoint: 0,
      genre: 'user',
      label: 'Current value',
      type: 'boolean',
      max: 99,
      min: 0,
      nodeId: 1,
      property: 'targetValue',
      propertyName: 'targetValue',
      writeable: true,
    });
    const nodes = zwaveJSUIManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].params).to.have.lengthOf(4);
    expect(nodes[0].features).to.deep.equal([
      {
        category: 'switch',
        external_id: 'zwave-js-ui:node_id:1:comclass:37:endpoint:0:property:targetValue',
        has_feedback: true,
        last_value: 0,
        name: 'Current value',
        read_only: false,
        selector: 'zwave-js-ui-node-1-targetvalue-37-0-current-value',
        type: 'binary',
        unit: null,
        max: 1,
        min: 0,
      },
    ]);
  });

  it('should handle value added 51-0-currentColor', () => {
    zwaveJSUIManager.valueAdded(zwaveNode, {
      commandClass: 51,
      endpoint: 0,
      property: 'currentColor',
      type: 'number',
      label: 'Current color',
      min: 0,
      max: 255,
      writeable: false,
    });
    expect(zwaveJSUIManager.nodes[1].classes[51][0]['targetColor-0']).to.deep.equal({
      commandClass: 51,
      endpoint: 0,
      genre: 'user',
      label: 'Current color',
      type: 'number',
      max: 255,
      min: 0,
      nodeId: 1,
      property: 'targetColor-0',
      propertyName: 'targetColor',
      writeable: true,
    });
    const nodes = zwaveJSUIManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].params).to.have.lengthOf(4);
    expect(nodes[0].features).to.deep.equal([
      {
        category: 'light',
        external_id: 'zwave-js-ui:node_id:1:comclass:51:endpoint:0:property:targetColor-0',
        has_feedback: true,
        last_value: undefined,
        name: 'Température',
        read_only: false,
        selector: 'zwave-js-ui-node-1-targetcolor-0-51-0-current-color',
        type: 'temperature',
        unit: null,
        max: 100,
        min: 0,
      },
    ]);
  });

  it('should handle value added unsupported command class', () => {
    zwaveJSUIManager.valueAdded(zwaveNode, {
      commandClass: 112,
      endpoint: 0,
      property: 'Test',
    });
    expect(zwaveJSUIManager.nodes[1].classes[112][0]).to.deep.equal({});
    const nodes = zwaveJSUIManager.getNodes();
    expect(nodes).to.have.lengthOf(0);
  });

  it('should handle value added with value', () => {
    zwaveJSUIManager.valueAdded(zwaveNode, {
      commandClass: 38,
      endpoint: 0,
      property: 'Test',
      value: 'newValue',
    });
    assert.calledOnceWithExactly(zwaveJSUIManager.eventManager.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'zwave-js-ui:node_id:1:comclass:38:endpoint:0:property:Test',
      state: 'newValue',
    });
  });

  it('should handle value added 48-0-Any', () => {
    zwaveJSUIManager.valueAdded(zwaveNode, {
      commandClass: 48,
      endpoint: 0,
      property: 'Any',
      type: 'number',
      label: 'Any',
      unit: 'W',
      writeable: false,
    });
    expect(zwaveJSUIManager.nodes[1].classes[48][0].Any).to.deep.equal({
      commandClass: 48,
      endpoint: 0,
      genre: 'user',
      label: 'Any',
      type: 'number',
      unit: 'W',
      nodeId: 1,
      property: 'Any',
      writeable: false,
    });
    const nodes = zwaveJSUIManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].params).to.have.lengthOf(4);
    expect(nodes[0].features).to.deep.equal([
      {
        category: 'motion-sensor',
        external_id: 'zwave-js-ui:node_id:1:comclass:48:endpoint:0:property:Any',
        type: 'binary',
        has_feedback: true,
        last_value: 0,
        name: 'Détecteur de présence',
        read_only: true,
        unit: 'watt',
        min: undefined,
        max: undefined,
        selector: 'zwave-js-ui-node-1-any-48-0-any',
      },
    ]);
  });

  it('should handle value added 48-0-Motion', () => {
    zwaveJSUIManager.valueAdded(zwaveNode, {
      commandClass: 48,
      endpoint: 0,
      property: 'Motion',
      type: 'binary',
      label: 'Motion',
      writeable: false,
    });
    expect(zwaveJSUIManager.nodes[1].classes[48][0].Motion).to.deep.equal({
      commandClass: 48,
      endpoint: 0,
      genre: 'user',
      label: 'Motion',
      type: 'binary',
      nodeId: 1,
      property: 'Motion',
      writeable: false,
    });
    const nodes = zwaveJSUIManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].params).to.have.lengthOf(4);
    expect(nodes[0].features).to.deep.equal([
      {
        category: 'motion-sensor',
        external_id: 'zwave-js-ui:node_id:1:comclass:48:endpoint:0:property:Motion',
        type: 'binary',
        has_feedback: true,
        last_value: 0,
        name: 'Détecteur de présence',
        read_only: true,
        unit: null,
        min: undefined,
        max: undefined,
        selector: 'zwave-js-ui-node-1-motion-48-0-motion',
      },
    ]);
  });

  it('should handle value added 48-0-Any and 48-0-Motion', () => {
    zwaveJSUIManager.valueAdded(zwaveNode, {
      commandClass: 48,
      endpoint: 0,
      property: 'Any',
      type: 'binary',
      label: 'Any',
      writeable: false,
    });
    zwaveJSUIManager.valueAdded(zwaveNode, {
      commandClass: 48,
      endpoint: 0,
      property: 'Motion',
      type: 'binary',
      label: 'Motion',
      writeable: false,
    });
    expect(zwaveJSUIManager.nodes[1].classes[48][0].Any).to.deep.equal({
      commandClass: 48,
      endpoint: 0,
      genre: 'user',
      label: 'Any',
      type: 'binary',
      nodeId: 1,
      property: 'Any',
      writeable: false,
    });
    expect(zwaveJSUIManager.nodes[1].classes[48][0].Motion).to.deep.equal({
      commandClass: 48,
      endpoint: 0,
      genre: 'user',
      label: 'Motion',
      type: 'binary',
      nodeId: 1,
      property: 'Motion',
      writeable: false,
    });
    const nodes = zwaveJSUIManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].params).to.have.lengthOf(4);
    expect(nodes[0].features).to.deep.equal([
      {
        category: 'motion-sensor',
        external_id: 'zwave-js-ui:node_id:1:comclass:48:endpoint:0:property:Motion',
        type: 'binary',
        has_feedback: true,
        last_value: 0,
        name: 'Détecteur de présence',
        read_only: true,
        unit: null,
        min: undefined,
        max: undefined,
        selector: 'zwave-js-ui-node-1-motion-48-0-motion',
      },
    ]);
  });

  /**
   * Power should be handled by Meter command class.
   */
  it('should handle value added 49-0-Power', () => {
    zwaveJSUIManager.valueAdded(zwaveNode, {
      commandClass: 49,
      endpoint: 0,
      property: 'Power',
      type: 'number',
      label: 'Power',
      unit: 'W',
      writeable: false,
    });
    expect(zwaveJSUIManager.nodes[1].classes[49][0].Power).to.deep.equal({
      commandClass: 49,
      endpoint: 0,
      genre: 'user',
      label: 'Power',
      type: 'number',
      unit: 'W',
      nodeId: 1,
      property: 'Power',
      writeable: false,
    });
    const nodes = zwaveJSUIManager.getNodes();
    expect(nodes).to.have.lengthOf(0);
  });

  it('should handle value added 49-0-Illuminance', () => {
    zwaveJSUIManager.valueAdded(zwaveNode, {
      commandClass: 49,
      endpoint: 0,
      property: 'Illuminance',
      type: 'number',
      label: 'Illuminance',
      unit: 'Lux',
      writeable: false,
    });
    expect(zwaveJSUIManager.nodes[1].classes[49][0].Illuminance).to.deep.equal({
      commandClass: 49,
      endpoint: 0,
      genre: 'user',
      label: 'Illuminance',
      type: 'number',
      unit: 'Lux',
      nodeId: 1,
      property: 'Illuminance',
      writeable: false,
    });
    const nodes = zwaveJSUIManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].params).to.have.lengthOf(4);
    expect(nodes[0].features).to.deep.equal([
      {
        category: 'light-sensor',
        external_id: 'zwave-js-ui:node_id:1:comclass:49:endpoint:0:property:Illuminance',
        has_feedback: true,
        last_value: undefined,
        name: 'Illuminance',
        read_only: true,
        selector: 'zwave-js-ui-node-1-illuminance-49-0-illuminance',
        type: 'integer',
        unit: 'lux',
        max: 100,
        min: 0,
      },
    ]);
  });

  it('should handle value added 49-0-Humidity', () => {
    zwaveJSUIManager.valueAdded(zwaveNode, {
      commandClass: 49,
      endpoint: 0,
      property: 'Humidity',
      type: 'number',
      label: 'Humidity',
      unit: '%',
      writeable: false,
    });
    expect(zwaveJSUIManager.nodes[1].classes[49][0].Humidity).to.deep.equal({
      commandClass: 49,
      endpoint: 0,
      genre: 'user',
      type: 'number',
      label: 'Humidity',
      unit: '%',
      nodeId: 1,
      property: 'Humidity',
      writeable: false,
    });
    const nodes = zwaveJSUIManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].params).to.have.lengthOf(4);
    expect(nodes[0].features).to.deep.equal([
      {
        category: 'humidity-sensor',
        external_id: 'zwave-js-ui:node_id:1:comclass:49:endpoint:0:property:Humidity',
        has_feedback: true,
        last_value: undefined,
        name: 'Humidity',
        read_only: true,
        selector: 'zwave-js-ui-node-1-humidity-49-0-humidity',
        type: 'decimal',
        unit: 'percent',
        min: 0,
        max: 100,
      },
    ]);
  });

  it('should handle value added 49-0-Ultraviolet', () => {
    zwaveJSUIManager.valueAdded(zwaveNode, {
      commandClass: 49,
      endpoint: 0,
      property: 'Ultraviolet',
      type: 'number',
      label: 'Ultraviolet',
      writeable: false,
    });
    expect(zwaveJSUIManager.nodes[1].classes[49][0].Ultraviolet).to.deep.equal({
      commandClass: 49,
      endpoint: 0,
      genre: 'user',
      label: 'Ultraviolet',
      type: 'number',
      nodeId: 1,
      property: 'Ultraviolet',
      writeable: false,
    });
    const nodes = zwaveJSUIManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].params).to.have.lengthOf(4);
    expect(nodes[0].features).to.deep.equal([
      {
        category: 'uv-sensor',
        external_id: 'zwave-js-ui:node_id:1:comclass:49:endpoint:0:property:Ultraviolet',
        has_feedback: true,
        last_value: undefined,
        name: 'Ultraviolet',
        read_only: true,
        selector: 'zwave-js-ui-node-1-ultraviolet-49-0-ultraviolet',
        type: 'integer',
        unit: null,
        min: 0,
        max: 100,
      },
    ]);
  });

  it('should handle value added 49-0-Air temperature', () => {
    zwaveJSUIManager.valueAdded(zwaveNode, {
      commandClass: 49,
      endpoint: 0,
      property: 'Air temperature',
      type: 'number',
      label: 'Air temperature',
      unit: '°C',
      writeable: false,
    });
    expect(zwaveJSUIManager.nodes[1].classes[49][0]['Air temperature']).to.deep.equal({
      commandClass: 49,
      endpoint: 0,
      genre: 'user',
      type: 'number',
      label: 'Air temperature',
      unit: '°C',
      nodeId: 1,
      property: 'Air temperature',
      writeable: false,
    });
    const nodes = zwaveJSUIManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].params).to.have.lengthOf(4);
    expect(nodes[0].features).to.deep.equal([
      {
        category: 'temperature-sensor',
        external_id: 'zwave-js-ui:node_id:1:comclass:49:endpoint:0:property:Air temperature',
        type: 'decimal',
        has_feedback: true,
        last_value: undefined,
        name: 'Air temperature',
        read_only: true,
        selector: 'zwave-js-ui-node-1-air-temperature-49-0-air-temperature',
        unit: 'celsius',
        min: -30,
        max: 50,
      },
    ]);
  });

  it('should handle value added 113-0-Smoke Alarm-Sensor status', () => {
    zwaveJSUIManager.valueAdded(zwaveNode, {
      commandClass: 113,
      endpoint: 0,
      property: 'Smoke Alarm-Sensor status',
      type: 'number',
      label: 'Motion sensor status',
      writeable: false,
    });
    expect(zwaveJSUIManager.nodes[1].classes[113][0]['Smoke Alarm-Sensor status']).to.deep.equal({
      commandClass: 113,
      endpoint: 0,
      genre: 'user',
      label: 'Motion sensor status',
      type: 'number',
      nodeId: 1,
      property: 'Smoke Alarm-Sensor status',
      writeable: false,
    });
    const nodes = zwaveJSUIManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].params).to.have.lengthOf(4);
    expect(nodes[0].features).to.deep.equal([
      {
        category: 'smoke-sensor',
        external_id: 'zwave-js-ui:node_id:1:comclass:113:endpoint:0:property:Smoke Alarm-Sensor status',
        has_feedback: true,
        last_value: undefined,
        name: 'Motion sensor status',
        read_only: true,
        selector: 'zwave-js-ui-node-1-smoke-alarm-sensor-status-113-0-motion-sensor-status',
        type: 'binary',
        unit: null,
        max: undefined,
        min: undefined,
      },
    ]);
  });

  it('should not handle value added 132-0-wakeUpInterval', () => {
    zwaveJSUIManager.valueAdded(zwaveNode, {
      commandClass: 132,
      endpoint: 0,
      property: 'wakeUpInterval',
      type: 'number',
      label: 'Wake Up interval',
      min: 300,
      max: 16777200,
      writeable: true,
    });
    expect(zwaveJSUIManager.nodes[1].classes[132][0]).to.deep.equal({});
    const nodes = zwaveJSUIManager.getNodes();
    expect(nodes).to.have.lengthOf(0);
  });

  it('should not handle value added 132-0-controllerNodeId', () => {
    zwaveJSUIManager.valueAdded(zwaveNode, {
      commandClass: 132,
      endpoint: 0,
      property: 'controllerNodeId',
      type: 'any',
      label: 'Node ID of the controller',
      writeable: false,
    });
    expect(zwaveJSUIManager.nodes[1].classes[132][0]).to.deep.equal({});
    const nodes = zwaveJSUIManager.getNodes();
    expect(nodes).to.have.lengthOf(0);
  });

  it('should not handle value added 132-0-level', () => {
    zwaveJSUIManager.valueAdded(zwaveNode, {
      commandClass: 132,
      endpoint: 0,
      property: 'level',
      type: 'number',
      label: 'Battery level',
      min: 0,
      max: 100,
      unit: '%',
      writeable: false,
    });
    expect(zwaveJSUIManager.nodes[1].classes[132][0]).to.deep.equal({});
    const nodes = zwaveJSUIManager.getNodes();
    expect(nodes).to.have.lengthOf(0);
  });

  it('should not handle value added 132-0-isLow', () => {
    zwaveJSUIManager.valueAdded(zwaveNode, {
      commandClass: 132,
      endpoint: 0,
      property: 'isLow',
      type: 'boolean',
      label: 'Low battery level',
      writeable: false,
    });
    expect(zwaveJSUIManager.nodes[1].classes[132][0]).to.deep.equal({});
    const nodes = zwaveJSUIManager.getNodes();
    expect(nodes).to.have.lengthOf(0);
  });

  it('should not handle value added 50-0-value-66048', () => {
    zwaveJSUIManager.valueAdded(zwaveNode, {
      commandClass: 50,
      endpoint: 0,
      property: 'value-66048',
      type: 'number',
      label: 'Electric [W]',
      writeable: false,
      unit: 'kWh',
    });
    const nodes = zwaveJSUIManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].params).to.have.lengthOf(4);
    expect(nodes[0].features).to.deep.equal([
      {
        category: 'switch',
        external_id: 'zwave-js-ui:node_id:1:comclass:50:endpoint:0:property:value-66048',
        has_feedback: true,
        last_value: undefined,
        name: 'Electric [W]',
        read_only: true,
        selector: 'zwave-js-ui-node-1-value-66048-50-0-electric-w',
        type: 'energy',
        unit: 'kilowatt-hour',
        max: 100000,
        min: 0,
      },
    ]);
  });

  it('should not handle value added 50-0-value-66049', () => {
    zwaveJSUIManager.valueAdded(zwaveNode, {
      commandClass: 50,
      endpoint: 0,
      property: 'value-66049',
      type: 'number',
      label: 'Electric Consumption [kWh]',
      writeable: false,
      unit: 'kWh',
    });
    const nodes = zwaveJSUIManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].params).to.have.lengthOf(4);
    expect(nodes[0].features).to.deep.equal([
      {
        category: 'switch',
        external_id: 'zwave-js-ui:node_id:1:comclass:50:endpoint:0:property:value-66049',
        has_feedback: true,
        last_value: undefined,
        name: 'Electric Consumption [kWh]',
        read_only: true,
        selector: 'zwave-js-ui-node-1-value-66049-50-0-electric-consumption-kwh',
        type: 'power',
        unit: 'kilowatt-hour',
        max: 10000,
        min: 0,
      },
    ]);
  });

  it('should not handle value added 50-0-value-66051', () => {
    zwaveJSUIManager.valueAdded(zwaveNode, {
      commandClass: 50,
      endpoint: 0,
      property: 'value-66051',
      type: 'number',
      label: 'Electric [W]',
      writeable: false,
      unit: 'W',
    });
    const nodes = zwaveJSUIManager.getNodes();
    expect(nodes).to.have.lengthOf(0);
  });

  it('should not handle value added 50-0-value-65536', () => {
    zwaveJSUIManager.valueAdded(zwaveNode, {
      commandClass: 50,
      endpoint: 0,
      property: 'value-65536',
      type: 'number',
      label: 'Electric [kWh]',
      writeable: false,
      unit: 'kWh',
    });
    const nodes = zwaveJSUIManager.getNodes();
    expect(nodes).to.have.lengthOf(0);
  });

  it('should not handle value added 50-0-value-65537', () => {
    zwaveJSUIManager.valueAdded(zwaveNode, {
      commandClass: 50,
      endpoint: 0,
      property: 'value-65537',
      type: 'number',
      label: 'Electric Consumption [W]',
      writeable: false,
      unit: 'W',
    });
    const nodes = zwaveJSUIManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].params).to.have.lengthOf(4);
    expect(nodes[0].features).to.deep.equal([
      {
        category: 'switch',
        external_id: 'zwave-js-ui:node_id:1:comclass:50:endpoint:0:property:value-65537',
        has_feedback: true,
        last_value: undefined,
        name: 'Electric Consumption [W]',
        read_only: true,
        selector: 'zwave-js-ui-node-1-value-65537-50-0-electric-consumption-w',
        type: 'energy',
        unit: 'watt',
        max: 100000,
        min: 0,
      },
    ]);
  });

  it('should not handle value added 50-0-value-65539', () => {
    zwaveJSUIManager.valueAdded(zwaveNode, {
      commandClass: 50,
      endpoint: 0,
      property: 'value-65539',
      type: 'number',
      label: 'Electric [kWh]',
      writeable: false,
      unit: 'kWh',
    });
    const nodes = zwaveJSUIManager.getNodes();
    expect(nodes).to.have.lengthOf(0);
  });

  it('should not handle value added 50-0-value-66561', () => {
    zwaveJSUIManager.valueAdded(zwaveNode, {
      commandClass: 50,
      endpoint: 0,
      property: 'value-66561',
      type: 'number',
      label: 'Electric Consumption [V]',
      writeable: false,
      unit: 'V',
    });
    const nodes = zwaveJSUIManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].params).to.have.lengthOf(4);
    expect(nodes[0].features).to.deep.equal([
      {
        category: 'switch',
        external_id: 'zwave-js-ui:node_id:1:comclass:50:endpoint:0:property:value-66561',
        has_feedback: true,
        last_value: undefined,
        name: 'Electric Consumption [V]',
        read_only: true,
        selector: 'zwave-js-ui-node-1-value-66561-50-0-electric-consumption-v',
        type: 'voltage',
        unit: 'volt',
        max: 400,
        min: 0,
      },
    ]);
  });

  it('should not handle value added 50-0-value-66817', () => {
    zwaveJSUIManager.valueAdded(zwaveNode, {
      commandClass: 50,
      endpoint: 0,
      property: 'value-66817',
      type: 'number',
      label: 'Electric Consumption [A]',
      writeable: false,
      unit: 'A',
    });
    const nodes = zwaveJSUIManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].params).to.have.lengthOf(4);
    expect(nodes[0].features).to.deep.equal([
      {
        category: 'switch',
        external_id: 'zwave-js-ui:node_id:1:comclass:50:endpoint:0:property:value-66817',
        has_feedback: true,
        last_value: undefined,
        name: 'Electric Consumption [A]',
        read_only: true,
        selector: 'zwave-js-ui-node-1-value-66817-50-0-electric-consumption-a',
        type: 'current',
        unit: 'ampere',
        max: 40,
        min: 0,
      },
    ]);
  });
});
