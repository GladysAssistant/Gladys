const sinon = require('sinon');

const { assert, fake } = sinon;

const ZwaveJSUIHandler = require('../../../../services/zwavejs-ui/lib');

const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

const gladys = {
  variable: {
    getValue: fake.resolves('toto'),
  },
  event: {
    emit: fake.returns(null),
  },
};

describe('zwaveJSUIHandler.onNodeValueUpdated', () => {
  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should not fail on unknown device', async () => {
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    zwaveJSUIHandler.devices = [
      {
        external_id: 'zwavejs-ui:2',
        features: [
          {
            external_id: 'zwavejs-ui:2:0:notification:access_control:door_state_simple',
          },
        ],
      },
    ];

    await zwaveJSUIHandler.onNodeValueUpdated({
      data: [
        { id: 4 },
        {
          commandClassName: 'Notification',
          commandClass: 113,
          property: 'Access Control',
          endpoint: 0,
          newValue: 22,
          prevValue: 23,
          propertyName: 'Access Control',
          propertyKey: 'Door state (simple)',
        },
      ],
    });
  });

  it('should not fail on unknown feature', async () => {
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    zwaveJSUIHandler.devices = [
      {
        external_id: 'zwavejs-ui:2',
        features: [],
      },
    ];

    await zwaveJSUIHandler.onNodeValueUpdated({
      data: [
        { id: 2 },
        {
          commandClassName: 'Notification',
          commandClass: 113,
          property: 'Access Control',
          endpoint: 0,
          newValue: 22,
          prevValue: 23,
          propertyName: 'Access Control',
          propertyKey: 'Door state (simple)',
        },
      ],
    });
  });

  it('should save a new open value', async () => {
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    zwaveJSUIHandler.devices = [
      {
        external_id: 'zwavejs-ui:2',
        features: [
          {
            external_id: 'zwavejs-ui:2:0:notification:access_control:door_state_simple',
          },
        ],
      },
    ];

    await zwaveJSUIHandler.onNodeValueUpdated({
      data: [
        { id: 2 },
        {
          commandClassName: 'Notification',
          commandClass: 113,
          property: 'Access Control',
          endpoint: 0,
          newValue: 22,
          prevValue: 23,
          propertyName: 'Access Control',
          propertyKey: 'Door state (simple)',
          propertyKeyName: 'Door state (simple)',
        },
      ],
    });
    assert.calledWith(gladys.event.emit, 'device.new-state', {
      device_feature_external_id: 'zwavejs-ui:2:0:notification:access_control:door_state_simple',
      state: 0,
    });
  });
  it('should save a new closed value', async () => {
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    zwaveJSUIHandler.devices = [
      {
        external_id: 'zwavejs-ui:2',
        features: [
          {
            external_id: 'zwavejs-ui:2:0:notification:access_control:door_state_simple',
          },
        ],
      },
    ];

    await zwaveJSUIHandler.onNodeValueUpdated({
      data: [
        { id: 2 },
        {
          commandClassName: 'Notification',
          commandClass: 113,
          property: 'Access Control',
          endpoint: 0,
          newValue: 23,
          prevValue: 22,
          propertyName: 'Access Control',
          propertyKey: 'Door state (simple)',
          propertyKeyName: 'Door state (simple)',
        },
      ],
    });
    assert.calledWith(gladys.event.emit, 'device.new-state', {
      device_feature_external_id: 'zwavejs-ui:2:0:notification:access_control:door_state_simple',
      state: 1,
    });
  });
  it('should not fail on unsupported door value', async () => {
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    zwaveJSUIHandler.devices = [
      {
        external_id: 'zwavejs-ui:2',
        features: [
          {
            external_id: 'zwavejs-ui:2:0:notification:access_control:door_state_simple',
          },
        ],
      },
    ];

    await zwaveJSUIHandler.onNodeValueUpdated({
      data: [
        { id: 2 },
        {
          commandClassName: 'Notification',
          commandClass: 113,
          property: 'Access Control',
          endpoint: 0,
          newValue: 45,
          prevValue: 22,
          propertyName: 'Access Control',
          propertyKey: 'Door state (simple)',
          propertyKeyName: 'Door state (simple)',
        },
      ],
    });
    assert.notCalled(gladys.event.emit);
  });
  it('should save a new true binary value', async () => {
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    zwaveJSUIHandler.devices = [
      {
        external_id: 'zwavejs-ui:3',
        features: [
          {
            external_id: 'zwavejs-ui:3:0:binary_switch:currentvalue',
          },
        ],
      },
    ];

    await zwaveJSUIHandler.onNodeValueUpdated({
      data: [
        { id: 3 },
        {
          commandClassName: 'Binary Switch',
          commandClass: 37,
          property: 'currentValue',
          endpoint: 0,
          newValue: true,
          prevValue: false,
          propertyName: 'currentValue',
        },
      ],
    });
    assert.calledWith(gladys.event.emit, 'device.new-state', {
      device_feature_external_id: 'zwavejs-ui:3:0:binary_switch:currentvalue',
      state: 1,
    });
  });
  it('should save a new false binary value', async () => {
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    zwaveJSUIHandler.devices = [
      {
        external_id: 'zwavejs-ui:3',
        features: [
          {
            external_id: 'zwavejs-ui:3:0:binary_switch:currentvalue',
          },
        ],
      },
    ];

    await zwaveJSUIHandler.onNodeValueUpdated({
      data: [
        { id: 3 },
        {
          commandClassName: 'Binary Switch',
          commandClass: 37,
          property: 'currentValue',
          endpoint: 0,
          newValue: false,
          prevValue: true,
          propertyName: 'currentValue',
        },
      ],
    });
    assert.calledWith(gladys.event.emit, 'device.new-state', {
      device_feature_external_id: 'zwavejs-ui:3:0:binary_switch:currentvalue',
      state: 0,
    });
  });

  it('should not fail on unsupported binary switch value', async () => {
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    zwaveJSUIHandler.devices = [
      {
        external_id: 'zwavejs-ui:3',
        features: [
          {
            external_id: 'zwavejs-ui:3:0:binary_switch:currentvalue',
          },
        ],
      },
    ];

    await zwaveJSUIHandler.onNodeValueUpdated({
      data: [
        { id: 3 },
        {
          commandClassName: 'Binary Switch',
          commandClass: 37,
          property: 'currentValue',
          endpoint: 0,
          newValue: -1,
          prevValue: true,
          propertyName: 'currentValue',
        },
      ],
    });
    assert.notCalled(gladys.event.emit);
  });
  it('should save a new air temperature value', async () => {
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    zwaveJSUIHandler.devices = [
      {
        external_id: 'zwavejs-ui:2',
        features: [
          {
            external_id: 'zwavejs-ui:2:0:multilevel_sensor:air_temperature',
          },
        ],
      },
    ];

    await zwaveJSUIHandler.onNodeValueUpdated({
      data: [
        { id: 2 },
        {
          commandClassName: 'Multilevel Sensor',
          commandClass: 49,
          property: 'Air temperature',
          endpoint: 0,
          newValue: 20.8,
          prevValue: 17.5,
          propertyName: 'Air temperature',
        },
      ],
    });
    assert.calledWith(gladys.event.emit, 'device.new-state', {
      device_feature_external_id: 'zwavejs-ui:2:0:multilevel_sensor:air_temperature',
      state: 20.8,
    });
  });

  it('should save a new power value', async () => {
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    zwaveJSUIHandler.devices = [
      {
        external_id: 'zwavejs-ui:2',
        features: [
          {
            external_id: 'zwavejs-ui:2:0:multilevel_sensor:power',
          },
        ],
      },
    ];

    await zwaveJSUIHandler.onNodeValueUpdated({
      data: [
        { id: 2 },
        {
          commandClassName: 'Multilevel Sensor',
          commandClass: 49,
          property: 'Power',
          endpoint: 0,
          newValue: 1.7,
          prevValue: 0,
          propertyName: 'Power',
        },
      ],
    });
    assert.calledWith(gladys.event.emit, 'device.new-state', {
      device_feature_external_id: 'zwavejs-ui:2:0:multilevel_sensor:power',
      state: 1.7,
    });
  });
});
