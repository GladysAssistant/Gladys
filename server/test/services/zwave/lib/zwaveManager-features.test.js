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
    zwaveManager.connected = true;
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

  it('should receive value added 37-0-currentValue', () => {
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
    expect(zwaveManager.nodes[1].classes[37][0].currentValue).to.deep.equal({
      commandClass: 37,
      endpoint: 0,
      genre: 'user',
      label: 'Current value',
      type: 'boolean',
      max: 99,
      min: 0,
      nodeId: 1,
      property: 'currentValue',
      writeable: false,
    });
    const nodes = zwaveManager.getNodes();
    expect(nodes).to.deep.equal([
      {
        name: 'name',
        service_id: 'ZWAVE_SERVICE_ID',
        external_id: 'zwave:node_id:1',
        ready: true,
        rawZwaveNode: {
          id: 1,
          type: 'type',
          product: 'product',
          keysClasses: ['37'],
          deviceDatabaseUrl: 'deviceDatabaseUrl',
        },
        params: [],
        features: [],
      },
    ]);
  });

  it('should receive value added 49-0-Illuminance', () => {
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
    expect(nodes).to.deep.equal([
      {
        name: 'name',
        service_id: 'ZWAVE_SERVICE_ID',
        external_id: 'zwave:node_id:1',
        ready: true,
        rawZwaveNode: {
          id: 1,
          type: 'type',
          product: 'product',
          keysClasses: ['49'],
          deviceDatabaseUrl: 'deviceDatabaseUrl',
        },
        params: [],
        features: [
          {
            category: 'light-sensor',
            external_id: 'zwave:node_id:1:comclass:49:endpoint:0:property:Illuminance',
            has_feedback: true,
            name: 'Illuminance',
            read_only: true,
            selector: 'zwave-illuminance-0-illuminance-product-node-1',
            type: 'integer',
            unit: 'lux',
            min: null,
            max: null,
          },
        ],
      },
    ]);
  });

  it('should receive value added 49-0-Humidity', () => {
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
    expect(nodes).to.deep.equal([
      {
        name: 'name',
        service_id: 'ZWAVE_SERVICE_ID',
        external_id: 'zwave:node_id:1',
        ready: true,
        rawZwaveNode: {
          id: 1,
          type: 'type',
          product: 'product',
          keysClasses: ['49'],
          deviceDatabaseUrl: 'deviceDatabaseUrl',
        },
        params: [],
        features: [
          {
            category: 'humidity-sensor',
            external_id: 'zwave:node_id:1:comclass:49:endpoint:0:property:Humidity',
            has_feedback: true,
            name: 'Humidity',
            read_only: true,
            selector: 'zwave-humidity-0-humidity-product-node-1',
            type: 'decimal',
            unit: 'percent',
            min: null,
            max: null,
          },
        ],
      },
    ]);
  });

  it('should receive value added 49-0-Ultraviolet', () => {
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
    expect(nodes).to.deep.equal([
      {
        name: 'name',
        service_id: 'ZWAVE_SERVICE_ID',
        external_id: 'zwave:node_id:1',
        ready: true,
        rawZwaveNode: {
          id: 1,
          type: 'type',
          product: 'product',
          keysClasses: ['49'],
          deviceDatabaseUrl: 'deviceDatabaseUrl',
        },
        params: [],
        features: [],
      },
    ]);
  });

  it('should receive value added 49-0-Air temperature', () => {
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
    expect(nodes).to.deep.equal([
      {
        name: 'name',
        service_id: 'ZWAVE_SERVICE_ID',
        external_id: 'zwave:node_id:1',
        ready: true,
        rawZwaveNode: {
          id: 1,
          type: 'type',
          product: 'product',
          keysClasses: ['49'],
          deviceDatabaseUrl: 'deviceDatabaseUrl',
        },
        params: [],
        features: [
          {
            category: 'temperature-sensor',
            external_id: 'zwave:node_id:1:comclass:49:endpoint:0:property:Air temperature',
            type: 'decimal',
            has_feedback: true,
            name: 'Air temperature',
            read_only: true,
            selector: 'zwave-air-temperature-0-air-temperature-product-node-1',
            unit: 'celsius',
            min: null,
            max: null,
          },
        ],
      },
    ]);
  });

  it('should receive value added 49-0-Power', () => {
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
      label: 'Power',
      type: 'number',
      unit: 'W',
      nodeId: 1,
      property: 'Power',
      writeable: false,
    });
    const nodes = zwaveManager.getNodes();
    expect(nodes).to.deep.equal([
      {
        name: 'name',
        service_id: 'ZWAVE_SERVICE_ID',
        external_id: 'zwave:node_id:1',
        ready: true,
        rawZwaveNode: {
          id: 1,
          type: 'type',
          product: 'product',
          keysClasses: ['49'],
          deviceDatabaseUrl: 'deviceDatabaseUrl',
        },
        params: [],
        features: [
          {
            category: 'switch',
            external_id: 'zwave:node_id:1:comclass:49:endpoint:0:property:Power',
            has_feedback: true,
            max: null,
            min: null,
            name: 'Power',
            read_only: true,
            selector: 'zwave-power-0-power-product-node-1',
            type: 'power',
            unit: 'watt',
          },
        ],
      },
    ]);
  });

  it('should receive value added 113-0-Home Security-Motion sensor status', () => {
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
    expect(nodes).to.deep.equal([
      {
        name: 'name',
        service_id: 'ZWAVE_SERVICE_ID',
        external_id: 'zwave:node_id:1',
        ready: true,
        rawZwaveNode: {
          id: 1,
          type: 'type',
          product: 'product',
          keysClasses: ['113'],
          deviceDatabaseUrl: 'deviceDatabaseUrl',
        },
        params: [],
        features: [
          {
            category: 'motion-sensor',
            external_id: 'zwave:node_id:1:comclass:113:endpoint:0:property:Home Security-Motion sensor status',
            has_feedback: true,
            name: 'Motion sensor status',
            read_only: true,
            selector: 'zwave-home-security-motion-sensor-status-0-motion-sensor-status-product-node-1',
            type: 'integer',
            min: null,
            max: null,
            unit: null,
          },
        ],
      },
    ]);
  });

  it('should receive value added 132-0-wakeUpInterval', () => {
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
    expect(zwaveManager.nodes[1].classes[132][0].wakeUpInterval).to.deep.equal({
      commandClass: 132,
      endpoint: 0,
      genre: 'system',
      label: 'Wake Up interval',
      type: 'number',
      max: 16777200,
      min: 300,
      nodeId: 1,
      property: 'wakeUpInterval',
      writeable: true,
    });
    const nodes = zwaveManager.getNodes();
    expect(nodes).to.deep.equal([
      {
        name: 'name',
        service_id: 'ZWAVE_SERVICE_ID',
        external_id: 'zwave:node_id:1',
        ready: true,
        rawZwaveNode: {
          id: 1,
          type: 'type',
          product: 'product',
          keysClasses: ['132'],
          deviceDatabaseUrl: 'deviceDatabaseUrl',
        },
        params: [
          {
            name: 'wake-up-interval-undefined',
            value: '',
          },
        ],
        features: [],
      },
    ]);
  });

  it('should receive value added 132-0-controllerNodeId', () => {
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
    expect(zwaveManager.nodes[1].classes[132][0].controllerNodeId).to.deep.equal({
      commandClass: 132,
      endpoint: 0,
      genre: 'system',
      label: 'Node ID of the controller',
      nodeId: 1,
      property: 'controllerNodeId',
      type: 'any',
      writeable: false,
    });
    const nodes = zwaveManager.getNodes();
    expect(nodes).to.deep.equal([
      {
        name: 'name',
        service_id: 'ZWAVE_SERVICE_ID',
        external_id: 'zwave:node_id:1',
        ready: true,
        rawZwaveNode: {
          id: 1,
          type: 'type',
          product: 'product',
          keysClasses: ['132'],
          deviceDatabaseUrl: 'deviceDatabaseUrl',
        },
        params: [
          {
            name: 'node-id-of-the-controller-undefined',
            value: '',
          },
        ],
        features: [],
      },
    ]);
  });

  it('should receive value added 132-0-level', () => {
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
    expect(zwaveManager.nodes[1].classes[132][0].level).to.deep.equal({
      commandClass: 132,
      endpoint: 0,
      genre: 'system',
      label: 'Battery level',
      type: 'number',
      max: 100,
      min: 0,
      unit: '%',
      nodeId: 1,
      property: 'level',
      writeable: false,
    });
    const nodes = zwaveManager.getNodes();
    expect(nodes).to.deep.equal([
      {
        name: 'name',
        service_id: 'ZWAVE_SERVICE_ID',
        external_id: 'zwave:node_id:1',
        ready: true,
        rawZwaveNode: {
          id: 1,
          type: 'type',
          product: 'product',
          keysClasses: ['132'],
          deviceDatabaseUrl: 'deviceDatabaseUrl',
        },
        params: [
          {
            name: 'battery-level-undefined',
            value: '',
          },
        ],
        features: [],
      },
    ]);
  });

  it('should receive value added 132-0-isLow', () => {
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
    expect(zwaveManager.nodes[1].classes[132][0].isLow).to.deep.equal({
      commandClass: 132,
      endpoint: 0,
      genre: 'system',
      label: 'Low battery level',
      type: 'boolean',
      nodeId: 1,
      property: 'isLow',
      writeable: false,
    });
    const nodes = zwaveManager.getNodes();
    expect(nodes).to.deep.equal([
      {
        name: 'name',
        service_id: 'ZWAVE_SERVICE_ID',
        external_id: 'zwave:node_id:1',
        ready: true,
        rawZwaveNode: {
          id: 1,
          type: 'type',
          product: 'product',
          keysClasses: ['132'],
          deviceDatabaseUrl: 'deviceDatabaseUrl',
        },
        params: [
          {
            name: 'low-battery-level-undefined',
            value: '',
          },
        ],
        features: [],
      },
    ]);
  });
});
