const sinon = require('sinon');

const { expect } = require('chai');

const { stub, fake } = sinon;
const EventEmitter = require('events');

const Zwavejs2mqttManager = require('../../../../services/zwavejs2mqtt/lib');
const { CONFIGURATION } = require('../../../../services/zwavejs2mqtt/lib/constants');

const ZWAVEJS2MQTT_SERVICE_ID = 'ZWAVEJS2MQTT_SERVICE_ID';
const DRIVER_PATH = 'DRIVER_PATH';

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

describe('zwavejs2mqttManager events', () => {
  let gladys;
  let zwavejs2mqttManager;
  let zwaveNode;

  before(() => {
    gladys = {
      user: {
        get: stub().resolves([{ id: ZWAVEJS2MQTT_SERVICE_ID }]),
      },
      service: {
        getService: stub().resolves({
          list: Promise.resolve([DRIVER_PATH]),
        }),
      },
      variable: {
        getValue: (name) => Promise.resolve(CONFIGURATION.EXTERNAL_ZWAVEJS2MQTT ? true : null),
        setValue: (name) => Promise.resolve(null),
      },
    };
    zwavejs2mqttManager = new Zwavejs2mqttManager(gladys, mqtt, ZWAVEJS2MQTT_SERVICE_ID);

    zwaveNode = {
      id: 1,
    };
  });

  beforeEach(() => {
    sinon.reset();

    zwavejs2mqttManager.mqttConnected = true;
    zwavejs2mqttManager.nodes = {
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

  it('should handle value added 37-0-currentValue', () => {
    zwaveNode.getValueMetadata = (args) => {
      return {
        type: 'boolean',
        label: 'Current value',
        min: 0,
        max: 99,
        writeable: false,
      };
    };
    zwavejs2mqttManager.valueAdded(zwaveNode, {
      commandClass: 37,
      endpoint: 0,
      property: 'currentValue',
    });
    expect(zwavejs2mqttManager.nodes[1].classes[37][0].targetValue).to.deep.equal({
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
      writeable: false,
    });
    const nodes = zwavejs2mqttManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].params).to.have.lengthOf(0);
    expect(nodes[0].features).to.deep.equal([
      {
        category: 'switch',
        external_id: 'zwavejs2mqtt:node_id:1:comclass:37:endpoint:0:property:targetValue',
        has_feedback: true,
        last_value: 0,
        name: 'Current value',
        read_only: true,
        selector: 'zwavejs2mqtt-node-1-targetvalue-37-0-current-value',
        type: 'binary',
        unit: null,
        max: 99,
        min: 0,
      },
    ]);
  });

  it('should handle value added 49-0-Illuminance', () => {
    zwaveNode.getValueMetadata = (args) => {
      return {
        type: 'number',
        label: 'Illuminance',
        unit: 'Lux',
        writeable: false,
      };
    };
    zwavejs2mqttManager.valueAdded(zwaveNode, {
      commandClass: 49,
      endpoint: 0,
      property: 'Illuminance',
    });
    expect(zwavejs2mqttManager.nodes[1].classes[49][0].Illuminance).to.deep.equal({
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
    const nodes = zwavejs2mqttManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].params).to.have.lengthOf(0);
    expect(nodes[0].features).to.deep.equal([
      {
        category: 'light-sensor',
        external_id: 'zwavejs2mqtt:node_id:1:comclass:49:endpoint:0:property:Illuminance',
        has_feedback: true,
        last_value: undefined,
        name: 'Illuminance',
        read_only: true,
        selector: 'zwavejs2mqtt-node-1-illuminance-49-0-illuminance',
        type: 'integer',
        unit: 'lux',
        max: 100,
        min: 0,
      },
    ]);
  });

  it('should handle value added 49-0-Humidity', () => {
    zwaveNode.getValueMetadata = (args) => {
      return {
        type: 'number',
        label: 'Humidity',
        unit: '%',
        writeable: false,
      };
    };
    zwavejs2mqttManager.valueAdded(zwaveNode, {
      commandClass: 49,
      endpoint: 0,
      property: 'Humidity',
    });
    expect(zwavejs2mqttManager.nodes[1].classes[49][0].Humidity).to.deep.equal({
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
    const nodes = zwavejs2mqttManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].params).to.have.lengthOf(0);
    expect(nodes[0].features).to.deep.equal([
      {
        category: 'humidity-sensor',
        external_id: 'zwavejs2mqtt:node_id:1:comclass:49:endpoint:0:property:Humidity',
        has_feedback: true,
        last_value: undefined,
        name: 'Humidity',
        read_only: true,
        selector: 'zwavejs2mqtt-node-1-humidity-49-0-humidity',
        type: 'decimal',
        unit: 'percent',
        min: 0,
        max: 100,
      },
    ]);
  });

  it('should handle value added 49-0-Ultraviolet', () => {
    zwaveNode.getValueMetadata = (args) => {
      return {
        type: 'number',
        label: 'Ultraviolet',
        writeable: false,
      };
    };
    zwavejs2mqttManager.valueAdded(zwaveNode, {
      commandClass: 49,
      endpoint: 0,
      property: 'Ultraviolet',
    });
    expect(zwavejs2mqttManager.nodes[1].classes[49][0].Ultraviolet).to.deep.equal({
      commandClass: 49,
      endpoint: 0,
      genre: 'user',
      label: 'Ultraviolet',
      type: 'number',
      nodeId: 1,
      property: 'Ultraviolet',
      writeable: false,
    });
    const nodes = zwavejs2mqttManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].params).to.have.lengthOf(0);
    expect(nodes[0].features).to.deep.equal([
      {
        category: 'uv-sensor',
        external_id: 'zwavejs2mqtt:node_id:1:comclass:49:endpoint:0:property:Ultraviolet',
        has_feedback: true,
        last_value: undefined,
        name: 'Ultraviolet',
        read_only: true,
        selector: 'zwavejs2mqtt-node-1-ultraviolet-49-0-ultraviolet',
        type: 'decimal',
        unit: null,
        min: 0,
        max: 100,
      },
    ]);
  });

  it('should handle value added 49-0-Air temperature', () => {
    zwaveNode.getValueMetadata = (args) => {
      return {
        type: 'number',
        label: 'Air temperature',
        unit: '°C',
        writeable: false,
      };
    };
    zwavejs2mqttManager.valueAdded(zwaveNode, {
      commandClass: 49,
      endpoint: 0,
      property: 'Air temperature',
    });
    expect(zwavejs2mqttManager.nodes[1].classes[49][0]['Air temperature']).to.deep.equal({
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
    const nodes = zwavejs2mqttManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].params).to.have.lengthOf(0);
    expect(nodes[0].features).to.deep.equal([
      {
        category: 'temperature-sensor',
        external_id: 'zwavejs2mqtt:node_id:1:comclass:49:endpoint:0:property:Air temperature',
        type: 'decimal',
        has_feedback: true,
        last_value: undefined,
        name: 'Air temperature',
        read_only: true,
        selector: 'zwavejs2mqtt-node-1-air-temperature-49-0-air-temperature',
        unit: 'celsius',
        min: -20,
        max: 50,
      },
    ]);
  });

  it('should handle value added 113-0-Smoke Alarm-Sensor status', () => {
    zwaveNode.getValueMetadata = (args) => {
      return {
        type: 'number',
        label: 'Motion sensor status',
        writeable: false,
      };
    };
    zwavejs2mqttManager.valueAdded(zwaveNode, {
      commandClass: 113,
      endpoint: 0,
      property: 'Smoke Alarm-Sensor status',
    });
    expect(zwavejs2mqttManager.nodes[1].classes[113][0]['Smoke Alarm-Sensor status']).to.deep.equal({
      commandClass: 113,
      endpoint: 0,
      genre: 'user',
      label: 'Motion sensor status',
      type: 'number',
      nodeId: 1,
      property: 'Smoke Alarm-Sensor status',
      writeable: false,
    });
    const nodes = zwavejs2mqttManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].params).to.have.lengthOf(0);
    expect(nodes[0].features).to.deep.equal([
      {
        category: 'smoke-sensor',
        external_id: 'zwavejs2mqtt:node_id:1:comclass:113:endpoint:0:property:Smoke Alarm-Sensor status',
        has_feedback: true,
        last_value: undefined,
        name: 'Motion sensor status',
        read_only: true,
        selector: 'zwavejs2mqtt-node-1-smoke-alarm-sensor-status-113-0-motion-sensor-status',
        type: 'binary',
        unit: null,
        max: undefined,
        min: undefined,
      },
    ]);
  });

  it('should not handle value added 132-0-wakeUpInterval', () => {
    zwaveNode.getValueMetadata = (args) => {
      return {
        type: 'number',
        label: 'Wake Up interval',
        min: 300,
        max: 16777200,
        writeable: true,
      };
    };
    zwavejs2mqttManager.valueAdded(zwaveNode, {
      commandClass: 132,
      endpoint: 0,
      property: 'wakeUpInterval',
    });
    expect(zwavejs2mqttManager.nodes[1].classes[132][0]).to.deep.equal({});
    const nodes = zwavejs2mqttManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].features).to.have.lengthOf(0);
    expect(nodes[0].params).to.have.lengthOf(0);
  });

  it('should not handle value added 132-0-controllerNodeId', () => {
    zwaveNode.getValueMetadata = (args) => {
      return {
        type: 'any',
        label: 'Node ID of the controller',
        writeable: false,
      };
    };
    zwavejs2mqttManager.valueAdded(zwaveNode, {
      commandClass: 132,
      endpoint: 0,
      property: 'controllerNodeId',
    });
    expect(zwavejs2mqttManager.nodes[1].classes[132][0]).to.deep.equal({});
    const nodes = zwavejs2mqttManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].features).to.have.lengthOf(0);
    expect(nodes[0].params).to.have.lengthOf(0);
  });

  it('should not handle value added 132-0-level', () => {
    zwaveNode.getValueMetadata = (args) => {
      return {
        type: 'number',
        label: 'Battery level',
        min: 0,
        max: 100,
        unit: '%',
        writeable: false,
      };
    };
    zwavejs2mqttManager.valueAdded(zwaveNode, {
      commandClass: 132,
      endpoint: 0,
      property: 'level',
    });
    expect(zwavejs2mqttManager.nodes[1].classes[132][0]).to.deep.equal({});
    const nodes = zwavejs2mqttManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].features).to.have.lengthOf(0);
    expect(nodes[0].params).to.have.lengthOf(0);
  });

  it('should not handle value added 132-0-isLow', () => {
    zwaveNode.getValueMetadata = (args) => {
      return {
        type: 'boolean',
        label: 'Low battery level',
        writeable: false,
      };
    };
    zwavejs2mqttManager.valueAdded(zwaveNode, {
      commandClass: 132,
      endpoint: 0,
      property: 'isLow',
    });
    expect(zwavejs2mqttManager.nodes[1].classes[132][0]).to.deep.equal({});
    const nodes = zwavejs2mqttManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].features).to.have.lengthOf(0);
    expect(nodes[0].params).to.have.lengthOf(0);
  });

  it('should not handle value added 50-0-value-66049', () => {
    zwaveNode.getValueMetadata = (args) => {
      return {
        type: 'number',
        label: 'Electric Consumption [W]',
        writeable: false,
        unit: 'W',
      };
    };

    zwavejs2mqttManager.valueAdded(zwaveNode, {
      commandClass: 50,
      endpoint: 0,
      property: 'value-66049',
    });
    const nodes = zwavejs2mqttManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].params).to.have.lengthOf(0);
    expect(nodes[0].features).to.deep.equal([
      {
        category: 'switch',
        external_id: 'zwavejs2mqtt:node_id:1:comclass:50:endpoint:0:property:value-66049',
        has_feedback: true,
        last_value: undefined,
        name: 'Electric Consumption [W]',
        read_only: true,
        selector: 'zwavejs2mqtt-node-1-value-66049-50-0-electric-consumption-w',
        type: 'energy',
        unit: 'watt',
        max: 100000,
        min: 0,
      },
    ]);
  });

  it('should not handle value added 50-0-value-66048', () => {
    zwaveNode.getValueMetadata = (args) => {
      return {
        type: 'number',
        label: 'Electric [W]',
        writeable: false,
        unit: 'kWh',
      };
    };

    zwavejs2mqttManager.valueAdded(zwaveNode, {
      commandClass: 50,
      endpoint: 0,
      property: 'value-66048',
    });
    const nodes = zwavejs2mqttManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].params).to.have.lengthOf(0);
    expect(nodes[0].features).to.deep.equal([
      {
        category: 'switch',
        external_id: 'zwavejs2mqtt:node_id:1:comclass:50:endpoint:0:property:value-66048',
        has_feedback: true,
        last_value: undefined,
        name: 'Electric [W]',
        read_only: true,
        selector: 'zwavejs2mqtt-node-1-value-66048-50-0-electric-w',
        type: 'energy',
        unit: 'kilowatt-hour',
        max: 100000,
        min: 0,
      },
    ]);
  });

  it('should not handle value added 50-0-value-65537', () => {
    zwaveNode.getValueMetadata = (args) => {
      return {
        type: 'number',
        label: 'Electric Consumption [kWh]',
        writeable: false,
        unit: 'kWh',
      };
    };

    zwavejs2mqttManager.valueAdded(zwaveNode, {
      commandClass: 50,
      endpoint: 0,
      property: 'value-65537',
    });
    const nodes = zwavejs2mqttManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].params).to.have.lengthOf(0);
    expect(nodes[0].features).to.deep.equal([
      {
        category: 'switch',
        external_id: 'zwavejs2mqtt:node_id:1:comclass:50:endpoint:0:property:value-65537',
        has_feedback: true,
        last_value: undefined,
        name: 'Electric Consumption [kWh]',
        read_only: true,
        selector: 'zwavejs2mqtt-node-1-value-65537-50-0-electric-consumption-kwh',
        type: 'power',
        unit: 'kilowatt-hour',
        max: 10000,
        min: 0,
      },
    ]);
  });

  it('should not handle value added 50-0-value-66561', () => {
    zwaveNode.getValueMetadata = (args) => {
      return {
        type: 'number',
        label: 'Electric Consumption [V]',
        writeable: false,
        unit: 'V',
      };
    };

    zwavejs2mqttManager.valueAdded(zwaveNode, {
      commandClass: 50,
      endpoint: 0,
      property: 'value-66561',
    });
    const nodes = zwavejs2mqttManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].params).to.have.lengthOf(0);
    expect(nodes[0].features).to.deep.equal([
      {
        category: 'switch',
        external_id: 'zwavejs2mqtt:node_id:1:comclass:50:endpoint:0:property:value-66561',
        has_feedback: true,
        last_value: undefined,
        name: 'Electric Consumption [V]',
        read_only: true,
        selector: 'zwavejs2mqtt-node-1-value-66561-50-0-electric-consumption-v',
        type: 'voltage',
        unit: 'volt',
        max: 400,
        min: 0,
      },
    ]);
  });

  it('should not handle value added 50-0-value-66817', () => {
    zwaveNode.getValueMetadata = (args) => {
      return {
        type: 'number',
        label: 'Electric Consumption [A]',
        writeable: false,
        unit: 'A',
      };
    };

    zwavejs2mqttManager.valueAdded(zwaveNode, {
      commandClass: 50,
      endpoint: 0,
      property: 'value-66817',
    });
    const nodes = zwavejs2mqttManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].params).to.have.lengthOf(0);
    expect(nodes[0].features).to.deep.equal([
      {
        category: 'switch',
        external_id: 'zwavejs2mqtt:node_id:1:comclass:50:endpoint:0:property:value-66817',
        has_feedback: true,
        last_value: undefined,
        name: 'Electric Consumption [A]',
        read_only: true,
        selector: 'zwavejs2mqtt-node-1-value-66817-50-0-electric-consumption-a',
        type: 'current',
        unit: 'ampere',
        max: 40,
        min: 0,
      },
    ]);
  });
});
