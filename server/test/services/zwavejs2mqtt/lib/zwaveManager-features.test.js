const { expect } = require('chai');
const { stub, fake } = require('sinon');
const EventEmitter = require('events');

const event = new EventEmitter();
const ZwaveManager = require('../../../../services/zwave/lib');

const ZWAVE_SERVICE_ID = 'ZWAVE_SERVICE_ID';

describe('zwaveManager events', () => {
  let gladys;
  let zwaveManager;
  let zwaveNode;

  before(() => {
    gladys = {
      user: {
        get: stub().resolves([{ id: ZWAVE_SERVICE_ID }]),
      },
      service: {
        getLocalServiceByName: stub().resolves({
          id: ZWAVE_SERVICE_ID,
        }),
      },
      variable: {
        getValue: stub().resolves(null),
        setValue: stub().resolves(null),
      },
    };
    zwaveManager = new ZwaveManager(gladys, event, ZWAVE_SERVICE_ID);
    zwaveManager.mqttConnected = true;
    zwaveManager.eventManager = {
      emit: stub().resolves(null),
    };
    zwaveManager.ZWaveJS = {
      Driver: fake.returns(null),
    };

    zwaveNode = {
      id: 1,
    };
  });

  beforeEach(() => {
    zwaveManager.eventManager.emit.reset();
    zwaveManager.nodes = {
      '1': {
        nodeId: 1,
        name: 'name',
        ready: true,
        classes: {},
        endpoints: [],
        type: 'type',
        product: 'product',
        keysClasses: [],
        deviceDatabaseUrl: 'deviceDatabaseUrl',
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
    zwaveManager.valueAdded(zwaveNode, {
      commandClass: 37,
      endpoint: 0,
      property: 'currentValue',
    });
    expect(zwaveManager.nodes[1].classes[37][0].targetValue).to.deep.equal({
      commandClass: 37,
      endpoint: 0,
      genre: 'user',
      label: 'Current value',
      type: 'boolean',
      max: 99,
      min: 0,
      nodeId: 1,
      property: 'targetValue',
      writeable: false,
    });
    const nodes = zwaveManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].params).to.have.lengthOf(0);
    expect(nodes[0].features).to.deep.equal([
      {
        category: 'switch',
        external_id: 'zwave:node_id:1:comclass:37:endpoint:0:property:targetValue',
        has_feedback: true,
        name: 'Current value',
        read_only: true,
        selector: 'zwave-node-1-targetvalue-37-0-current-value',
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
    zwaveManager.valueAdded(zwaveNode, {
      commandClass: 49,
      endpoint: 0,
      property: 'Illuminance',
    });
    expect(zwaveManager.nodes[1].classes[49][0].Illuminance).to.deep.equal({
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
    const nodes = zwaveManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].params).to.have.lengthOf(0);
    expect(nodes[0].features).to.deep.equal([
      {
        category: 'light-sensor',
        external_id: 'zwave:node_id:1:comclass:49:endpoint:0:property:Illuminance',
        has_feedback: true,
        name: 'Illuminance',
        read_only: true,
        selector: 'zwave-node-1-illuminance-49-0-illuminance',
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
    zwaveManager.valueAdded(zwaveNode, {
      commandClass: 49,
      endpoint: 0,
      property: 'Humidity',
    });
    expect(zwaveManager.nodes[1].classes[49][0].Humidity).to.deep.equal({
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
    const nodes = zwaveManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].params).to.have.lengthOf(0);
    expect(nodes[0].features).to.deep.equal([
      {
        category: 'humidity-sensor',
        external_id: 'zwave:node_id:1:comclass:49:endpoint:0:property:Humidity',
        has_feedback: true,
        name: 'Humidity',
        read_only: true,
        selector: 'zwave-node-1-humidity-49-0-humidity',
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
    zwaveManager.valueAdded(zwaveNode, {
      commandClass: 49,
      endpoint: 0,
      property: 'Ultraviolet',
    });
    expect(zwaveManager.nodes[1].classes[49][0].Ultraviolet).to.deep.equal({
      commandClass: 49,
      endpoint: 0,
      genre: 'user',
      label: 'Ultraviolet',
      type: 'number',
      nodeId: 1,
      property: 'Ultraviolet',
      writeable: false,
    });
    const nodes = zwaveManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].params).to.have.lengthOf(0);
    expect(nodes[0].features).to.deep.equal([
      {
        category: 'uv-sensor',
        external_id: 'zwave:node_id:1:comclass:49:endpoint:0:property:Ultraviolet',
        has_feedback: true,
        name: 'Ultraviolet',
        read_only: true,
        selector: 'zwave-node-1-ultraviolet-49-0-ultraviolet',
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
    zwaveManager.valueAdded(zwaveNode, {
      commandClass: 49,
      endpoint: 0,
      property: 'Air temperature',
    });
    expect(zwaveManager.nodes[1].classes[49][0]['Air temperature']).to.deep.equal({
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
    const nodes = zwaveManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].params).to.have.lengthOf(0);
    expect(nodes[0].features).to.deep.equal([
      {
        category: 'temperature-sensor',
        external_id: 'zwave:node_id:1:comclass:49:endpoint:0:property:Air temperature',
        type: 'decimal',
        has_feedback: true,
        name: 'Air temperature',
        read_only: true,
        selector: 'zwave-node-1-air-temperature-49-0-air-temperature',
        unit: 'celsius',
        min: -20,
        max: 50,
      },
    ]);
  });

  it('should handle value added 49-0-Power', () => {
    zwaveNode.getValueMetadata = (args) => {
      return {
        type: 'number',
        label: 'Power',
        unit: 'W',
        writeable: false,
      };
    };
    zwaveManager.valueAdded(zwaveNode, {
      commandClass: 49,
      endpoint: 0,
      property: 'Power',
    });
    expect(zwaveManager.nodes[1].classes[49][0].Power).to.deep.equal({
      commandClass: 49,
      endpoint: 0,
      genre: 'user',
      type: 'number',
      label: 'Power',
      unit: 'W',
      nodeId: 1,
      property: 'Power',
      writeable: false,
    });
    const nodes = zwaveManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].params).to.have.lengthOf(0);
    expect(nodes[0].features).to.deep.equal([
      {
        category: 'power-sensor',
        external_id: 'zwave:node_id:1:comclass:49:endpoint:0:property:Power',
        type: 'decimal',
        has_feedback: true,
        name: 'Power',
        read_only: true,
        selector: 'zwave-node-1-power-49-0-power',
        unit: 'celsius',
        min: -20,
        max: 50,
      },
    ]);
  });

  it('should handle value added 113-0-Home Security-Motion sensor status', () => {
    zwaveNode.getValueMetadata = (args) => {
      return {
        type: 'number',
        label: 'Motion sensor status',
        writeable: false,
      };
    };
    zwaveManager.valueAdded(zwaveNode, {
      commandClass: 113,
      endpoint: 0,
      property: 'Home Security-Motion sensor status',
    });
    expect(zwaveManager.nodes[1].classes[113][0]['Home Security-Motion sensor status']).to.deep.equal({
      commandClass: 113,
      endpoint: 0,
      genre: 'user',
      label: 'Motion sensor status',
      type: 'number',
      nodeId: 1,
      property: 'Home Security-Motion sensor status',
      writeable: false,
    });
    const nodes = zwaveManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].params).to.have.lengthOf(0);
    expect(nodes[0].features).to.deep.equal([
      {
        category: 'motion-sensor',
        external_id: 'zwave:node_id:1:comclass:113:endpoint:0:property:Home Security-Motion sensor status',
        has_feedback: true,
        name: 'Motion sensor status',
        read_only: true,
        selector: 'zwave-node-1-home-security-motion-sensor-status-113-0-motion-sensor-status',
        type: 'integer',
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
    zwaveManager.valueAdded(zwaveNode, {
      commandClass: 132,
      endpoint: 0,
      property: 'wakeUpInterval',
    });
    expect(zwaveManager.nodes[1].classes[132][0]).to.deep.equal({});
    const nodes = zwaveManager.getNodes();
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
    zwaveManager.valueAdded(zwaveNode, {
      commandClass: 132,
      endpoint: 0,
      property: 'controllerNodeId',
    });
    expect(zwaveManager.nodes[1].classes[132][0]).to.deep.equal({});
    const nodes = zwaveManager.getNodes();
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
    zwaveManager.valueAdded(zwaveNode, {
      commandClass: 132,
      endpoint: 0,
      property: 'level',
    });
    expect(zwaveManager.nodes[1].classes[132][0]).to.deep.equal({});
    const nodes = zwaveManager.getNodes();
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
    zwaveManager.valueAdded(zwaveNode, {
      commandClass: 132,
      endpoint: 0,
      property: 'isLow',
    });
    expect(zwaveManager.nodes[1].classes[132][0]).to.deep.equal({});
    const nodes = zwaveManager.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0].features).to.have.lengthOf(0);
    expect(nodes[0].params).to.have.lengthOf(0);
  });
});
