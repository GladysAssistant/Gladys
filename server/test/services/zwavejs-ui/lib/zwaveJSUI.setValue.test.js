const sinon = require('sinon');
const { expect } = require('chai');

const { assert, fake } = sinon;

const ZwaveJSUIHandler = require('../../../../services/zwavejs-ui/lib');
const { BadParameters } = require('../../../../utils/coreErrors');
const { STATE, COVER_STATE } = require('../../../../utils/constants');

const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

const gladys = {
  variable: {
    getValue: fake.resolves('toto'),
  },
  event: {
    emit: fake.returns(null),
  },
  device: {
    saveState: fake.returns(Promise.resolve()),
  },
};

describe('zwaveJSUIHandler.setValue', () => {
  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should fail on unknown Gladys device', async () => {
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    try {
      await zwaveJSUIHandler.setValue(
        { external_id: 'zwavejs-ui:2' },
        {
          external_id: 'zwavejs-ui:42:0:notification:unused:unused',
        },
        '1',
      );
    } catch (e) {
      expect(e).instanceOf(BadParameters);

      return;
    }

    assert.fail();
  });

  it('should fail on invalid feature', async () => {
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    try {
      await zwaveJSUIHandler.setValue(
        { external_id: 'zwavejs-ui:2' },
        {
          external_id: 'not-zwavejs-ui:42:0:unused:unused:unused',
        },
        '1',
      );
    } catch (e) {
      expect(e).instanceOf(BadParameters);

      return;
    }

    assert.fail();
  });

  it('should fail on unknown feature', async () => {
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
    zwaveJSUIHandler.zwaveJSDevices = [
      {
        id: 2,
        deviceClass: {
          basic: 4,
          generic: 7,
          specific: 1,
        },
      },
    ];
    try {
      await zwaveJSUIHandler.setValue(
        zwaveJSUIHandler.devices[0],
        {
          external_id: 'zwavejs-ui:2:0:other:not_known:not_known',
        },
        '1',
      );
    } catch (e) {
      expect(e).instanceOf(BadParameters);

      return;
    }

    assert.fail();
  });

  it('should fail on unknown command', async () => {
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    zwaveJSUIHandler.devices = [
      {
        external_id: 'zwavejs-ui:2',
        features: [
          {
            external_id: 'zwavejs-ui:2:0:notification:access_control:door_state_simple',
            command_class_name: 'Notification',
            property_name: 'Access Control',
            property_key_name: 'Door State (Simple)',
          },
        ],
      },
    ];
    zwaveJSUIHandler.zwaveJSDevices = [
      {
        id: 2,
        deviceClass: {
          basic: 4,
          generic: 7,
          specific: 1,
        },
      },
    ];

    try {
      await zwaveJSUIHandler.setValue(zwaveJSUIHandler.devices[0], zwaveJSUIHandler.devices[0].features[0], '1');
    } catch (e) {
      expect(e).instanceOf(BadParameters);

      return;
    }

    assert.fail();
  });

  it('should turn off binary switch', async () => {
    const mqttClient = {
      publish: fake.returns(null),
    };
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    zwaveJSUIHandler.mqttClient = mqttClient;
    zwaveJSUIHandler.devices = [
      {
        name: 'prise01-wp',
        external_id: 'zwavejs-ui:3',
        selector: 'zwavejs-ui:3',
        service_id: 'ee03cc7e-8551-4774-bd47-ca7565f6665d',
        should_poll: false,
        features: [
          {
            category: 'switch',
            type: 'binary',
            min: 0,
            max: 1,
            keep_history: true,
            read_only: false,
            has_feedback: true,
            name: '3-37-0-currentValue',
            external_id: 'zwavejs-ui:3:0:binary_switch:currentvalue',
            selector: 'zwavejs-ui:3:0:binary_switch:currentvalue',
            node_id: 3,
            command_class_version: 1,
            command_class_name: 'Binary Switch',
            command_class: 37,
            endpoint: 0,
            property_name: 'currentValue',
            property_key_name: undefined,
          },
        ],
      },
    ];
    zwaveJSUIHandler.zwaveJSDevices = [
      {
        id: 3,
        deviceClass: {
          basic: 4,
          generic: 16,
          specific: 1,
        },
      },
    ];

    await zwaveJSUIHandler.setValue(zwaveJSUIHandler.devices[0], zwaveJSUIHandler.devices[0].features[0], STATE.OFF);

    const mqttPayload = {
      args: [{ nodeId: 3, commandClass: 37, endpoint: 0 }, 'set', [false]],
    };
    assert.calledWith(
      mqttClient.publish,
      'zwave/_CLIENTS/ZWAVE_GATEWAY-zwave-js-ui/api/sendCommand/set',
      JSON.stringify(mqttPayload),
    );
  });

  it('should turn on binary switch', async () => {
    const mqttClient = {
      publish: fake.returns(null),
    };
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    zwaveJSUIHandler.mqttClient = mqttClient;
    zwaveJSUIHandler.devices = [
      {
        name: 'prise01-wp',
        external_id: 'zwavejs-ui:3',
        selector: 'zwavejs-ui:3',
        service_id: 'ee03cc7e-8551-4774-bd47-ca7565f6665d',
        should_poll: false,
        features: [
          {
            category: 'switch',
            type: 'binary',
            min: 0,
            max: 1,
            keep_history: true,
            read_only: false,
            has_feedback: true,
            name: '3-37-0-currentValue',
            external_id: 'zwavejs-ui:3:0:binary_switch:currentvalue',
            selector: 'zwavejs-ui:3:0:binary_switch:currentvalue',
            node_id: 3,
            command_class_version: 1,
            command_class_name: 'Binary Switch',
            command_class: 37,
            endpoint: 0,
            property_name: 'currentValue',
            property_key_name: undefined,
          },
        ],
      },
    ];
    zwaveJSUIHandler.zwaveJSDevices = [
      {
        id: 3,
        deviceClass: {
          basic: 4,
          generic: 16,
          specific: 1,
        },
      },
    ];

    await zwaveJSUIHandler.setValue(zwaveJSUIHandler.devices[0], zwaveJSUIHandler.devices[0].features[0], STATE.ON);

    const mqttPayload = {
      args: [{ nodeId: 3, commandClass: 37, endpoint: 0 }, 'set', [true]],
    };
    assert.calledWith(
      mqttClient.publish,
      'zwave/_CLIENTS/ZWAVE_GATEWAY-zwave-js-ui/api/sendCommand/set',
      JSON.stringify(mqttPayload),
    );
  });

  it('should fail on invalid binary switch value', async () => {
    const mqttClient = {
      publish: fake.returns(null),
    };
    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    zwaveJSUIHandler.mqttClient = mqttClient;
    zwaveJSUIHandler.devices = [
      {
        name: 'prise01-wp',
        external_id: 'zwavejs-ui:3',
        service_id: 'ee03cc7e-8551-4774-bd47-ca7565f6665d',
        should_poll: false,
        features: [
          {
            category: 'switch',
            type: 'binary',
            min: 0,
            max: 1,
            keep_history: true,
            read_only: false,
            has_feedback: true,
            name: '3-37-0-currentValue',
            external_id: 'zwavejs-ui:3:0:binary_switch:currentvalue',
            node_id: 3,
            command_class_version: 1,
            command_class_name: 'Binary Switch',
            command_class: 37,
            endpoint: 0,
            property_name: 'currentValue',
            property_key_name: undefined,
          },
        ],
      },
    ];
    zwaveJSUIHandler.zwaveJSDevices = [
      {
        id: 3,
        deviceClass: {
          basic: 4,
          generic: 16,
          specific: 1,
        },
      },
    ];

    try {
      await zwaveJSUIHandler.setValue(zwaveJSUIHandler.devices[0], zwaveJSUIHandler.devices[0].features[0], 4);
    } catch (e) {
      expect(e).instanceOf(BadParameters);

      return;
    }

    assert.fail();
  });

  it('should set multilevel switch currentvalue to 0 on state OFF', async () => {
    const mqttClient = {
      publish: fake.returns(null),
    };

    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    zwaveJSUIHandler.mqttClient = mqttClient;
    zwaveJSUIHandler.devices = [
      {
        external_id: 'zwavejs-ui:6',
        features: [
          {
            category: 'switch',
            command_class: 38,
            command_class_name: 'Multilevel Switch',
            command_class_version: 4,
            endpoint: 0,
            external_id: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:state',
            feature_name: 'state',
            has_feedback: false,
            keep_history: true,
            max: 1,
            min: 0,
            name: '6-38-0-currentValue:state',
            node_id: 6,
            property_key_name: undefined,
            property_name: 'currentValue',
            read_only: false,
            selector: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:state',
            type: 'binary',
          },
          {
            category: 'switch',
            command_class: 38,
            command_class_name: 'Multilevel Switch',
            command_class_version: 4,
            endpoint: 0,
            external_id: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:position',
            feature_name: 'position',
            has_feedback: false,
            keep_history: true,
            max: 99,
            min: 0,
            name: '6-38-0-currentValue:position',
            node_id: 6,
            property_key_name: undefined,
            property_name: 'currentValue',
            read_only: false,
            selector: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:position',
            type: 'dimmer',
            unit: 'percent',
          },
        ],
        name: 'inter-01',
        service_id: 'ffa13430-df93-488a-9733-5c540e9558e0',
      },
    ];
    zwaveJSUIHandler.zwaveJSDevices = [
      {
        id: 6,
        deviceClass: {
          basic: 4,
          generic: 17,
          specific: 1,
        },
      },
    ];

    await zwaveJSUIHandler.setValue(zwaveJSUIHandler.devices[0], zwaveJSUIHandler.devices[0].features[0], STATE.OFF);

    // Assert message published
    const mqttPayload = {
      args: [{ nodeId: 6, commandClass: 38, endpoint: 0 }, 'set', [0]],
    };
    assert.calledWith(
      mqttClient.publish,
      'zwave/_CLIENTS/ZWAVE_GATEWAY-zwave-js-ui/api/sendCommand/set',
      JSON.stringify(mqttPayload),
    );

    // Assert position state has been updated
    assert.calledWith(gladys.device.saveState, zwaveJSUIHandler.devices[0].features[1], 0);
  });

  it('should set multilevel switch currentvalue to 99 on state ON', async () => {
    const mqttClient = {
      publish: fake.returns(null),
    };

    const zwaveJSUIHandler = new ZwaveJSUIHandler({ ...gladys }, {}, serviceId);
    zwaveJSUIHandler.mqttClient = mqttClient;
    zwaveJSUIHandler.devices = [
      {
        external_id: 'zwavejs-ui:6',
        features: [
          {
            category: 'switch',
            command_class: 38,
            command_class_name: 'Multilevel Switch',
            command_class_version: 4,
            endpoint: 0,
            external_id: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:state',
            feature_name: 'state',
            has_feedback: false,
            keep_history: true,
            max: 1,
            min: 0,
            name: '6-38-0-currentValue:state',
            node_id: 6,
            property_key_name: undefined,
            property_name: 'currentValue',
            read_only: false,
            selector: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:state',
            type: 'binary',
          },
          {
            category: 'switch',
            command_class: 38,
            command_class_name: 'Multilevel Switch',
            command_class_version: 4,
            endpoint: 0,
            external_id: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:position',
            feature_name: 'position',
            has_feedback: false,
            keep_history: true,
            max: 99,
            min: 0,
            name: '6-38-0-currentValue:position',
            node_id: 6,
            property_key_name: undefined,
            property_name: 'currentValue',
            read_only: false,
            selector: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:position',
            type: 'dimmer',
            unit: 'percent',
          },
        ],
        name: 'inter-01',
        service_id: 'ffa13430-df93-488a-9733-5c540e9558e0',
      },
    ];
    zwaveJSUIHandler.zwaveJSDevices = [
      {
        id: 6,
        deviceClass: {
          basic: 4,
          generic: 17,
          specific: 1,
        },
      },
    ];

    await zwaveJSUIHandler.setValue(zwaveJSUIHandler.devices[0], zwaveJSUIHandler.devices[0].features[0], STATE.ON);

    // Assert message published
    const mqttPayload = {
      args: [{ nodeId: 6, commandClass: 38, endpoint: 0 }, 'set', [99]],
    };
    assert.calledWith(
      mqttClient.publish,
      'zwave/_CLIENTS/ZWAVE_GATEWAY-zwave-js-ui/api/sendCommand/set',
      JSON.stringify(mqttPayload),
    );

    // Assert position state has been updated
    assert.calledWith(gladys.device.saveState, zwaveJSUIHandler.devices[0].features[1], 99);
  });

  it('should set multilevel switch currentvalue to value on position set to 0', async () => {
    const mqttClient = {
      publish: fake.returns(null),
    };

    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    zwaveJSUIHandler.mqttClient = mqttClient;
    zwaveJSUIHandler.devices = [
      {
        external_id: 'zwavejs-ui:6',
        features: [
          {
            category: 'switch',
            command_class: 38,
            command_class_name: 'Multilevel Switch',
            command_class_version: 4,
            endpoint: 0,
            external_id: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:state',
            feature_name: 'state',
            has_feedback: false,
            keep_history: true,
            max: 1,
            min: 0,
            name: '6-38-0-currentValue:state',
            node_id: 6,
            property_key_name: undefined,
            property_name: 'currentValue',
            read_only: false,
            selector: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:state',
            type: 'binary',
          },
          {
            category: 'switch',
            command_class: 38,
            command_class_name: 'Multilevel Switch',
            command_class_version: 4,
            endpoint: 0,
            external_id: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:position',
            feature_name: 'position',
            has_feedback: false,
            keep_history: true,
            max: 99,
            min: 0,
            name: '6-38-0-currentValue:position',
            node_id: 6,
            property_key_name: undefined,
            property_name: 'currentValue',
            read_only: false,
            selector: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:position',
            type: 'dimmer',
            unit: 'percent',
          },
        ],
        name: 'inter-01',
        service_id: 'ffa13430-df93-488a-9733-5c540e9558e0',
      },
    ];
    zwaveJSUIHandler.zwaveJSDevices = [
      {
        id: 6,
        deviceClass: {
          basic: 4,
          generic: 17,
          specific: 1,
        },
      },
    ];

    await zwaveJSUIHandler.setValue(zwaveJSUIHandler.devices[0], zwaveJSUIHandler.devices[0].features[1], 0);

    // Assert message published
    const mqttPayload = {
      args: [{ nodeId: 6, commandClass: 38, endpoint: 0 }, 'set', [0]],
    };
    assert.calledWith(
      mqttClient.publish,
      'zwave/_CLIENTS/ZWAVE_GATEWAY-zwave-js-ui/api/sendCommand/set',
      JSON.stringify(mqttPayload),
    );

    // Assert state has been updated
    assert.calledWith(gladys.device.saveState, zwaveJSUIHandler.devices[0].features[0], STATE.OFF);
  });

  it('should set multilevel switch currentvalue to value on positive position updated', async () => {
    const mqttClient = {
      publish: fake.returns(null),
    };

    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    zwaveJSUIHandler.mqttClient = mqttClient;
    zwaveJSUIHandler.devices = [
      {
        external_id: 'zwavejs-ui:6',
        features: [
          {
            category: 'switch',
            command_class: 38,
            command_class_name: 'Multilevel Switch',
            command_class_version: 4,
            endpoint: 0,
            external_id: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:state',
            feature_name: 'state',
            has_feedback: false,
            keep_history: true,
            max: 1,
            min: 0,
            name: '6-38-0-currentValue:state',
            node_id: 6,
            property_key_name: undefined,
            property_name: 'currentValue',
            read_only: false,
            selector: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:state',
            type: 'binary',
          },
          {
            category: 'switch',
            command_class: 38,
            command_class_name: 'Multilevel Switch',
            command_class_version: 4,
            endpoint: 0,
            external_id: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:position',
            feature_name: 'position',
            has_feedback: false,
            keep_history: true,
            max: 99,
            min: 0,
            name: '6-38-0-currentValue:position',
            node_id: 6,
            property_key_name: undefined,
            property_name: 'currentValue',
            read_only: false,
            selector: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:position',
            type: 'dimmer',
            unit: 'percent',
          },
        ],
        name: 'inter-01',
        service_id: 'ffa13430-df93-488a-9733-5c540e9558e0',
      },
    ];
    zwaveJSUIHandler.zwaveJSDevices = [
      {
        id: 6,
        deviceClass: {
          basic: 4,
          generic: 17,
          specific: 1,
        },
      },
    ];

    await zwaveJSUIHandler.setValue(zwaveJSUIHandler.devices[0], zwaveJSUIHandler.devices[0].features[1], 42);

    // Assert message published
    const mqttPayload = {
      args: [{ nodeId: 6, commandClass: 38, endpoint: 0 }, 'set', [42]],
    };
    assert.calledWith(
      mqttClient.publish,
      'zwave/_CLIENTS/ZWAVE_GATEWAY-zwave-js-ui/api/sendCommand/set',
      JSON.stringify(mqttPayload),
    );

    // Assert state has been updated
    assert.calledWith(gladys.device.saveState, zwaveJSUIHandler.devices[0].features[0], STATE.ON);
  });

  it('should set curtains multilevel switch currentvalue to 99 on state CLOSE', async () => {
    const mqttClient = {
      publish: fake.returns(null),
    };

    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    zwaveJSUIHandler.mqttClient = mqttClient;
    zwaveJSUIHandler.devices = [
      {
        external_id: 'zwavejs-ui:6',
        features: [
          {
            category: 'switch',
            command_class: 38,
            command_class_name: 'Multilevel Switch',
            command_class_version: 4,
            endpoint: 0,
            external_id: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:state',
            feature_name: 'state',
            has_feedback: false,
            keep_history: true,
            max: 1,
            min: 0,
            name: '6-38-0-currentValue:state',
            node_id: 6,
            property_key_name: undefined,
            property_name: 'currentValue',
            read_only: false,
            selector: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:state',
            type: 'binary',
          },
          {
            category: 'switch',
            command_class: 38,
            command_class_name: 'Multilevel Switch',
            command_class_version: 4,
            endpoint: 0,
            external_id: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:position',
            feature_name: 'position',
            has_feedback: false,
            keep_history: true,
            max: 99,
            min: 0,
            name: '6-38-0-currentValue:position',
            node_id: 6,
            property_key_name: undefined,
            property_name: 'currentValue',
            read_only: false,
            selector: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:position',
            type: 'dimmer',
            unit: 'percent',
          },
        ],
        name: 'curtain-01',
        service_id: 'ffa13430-df93-488a-9733-5c540e9558e0',
      },
    ];
    zwaveJSUIHandler.zwaveJSDevices = [
      {
        id: 6,
        deviceClass: {
          basic: 4,
          generic: 17,
          specific: 5,
        },
      },
    ];

    await zwaveJSUIHandler.setValue(
      zwaveJSUIHandler.devices[0],
      zwaveJSUIHandler.devices[0].features[0],
      COVER_STATE.CLOSE,
    );

    // Assert message published
    const mqttPayload = {
      args: [{ nodeId: 6, commandClass: 38, endpoint: 0 }, 'set', [99]],
    };
    assert.calledWith(
      mqttClient.publish,
      'zwave/_CLIENTS/ZWAVE_GATEWAY-zwave-js-ui/api/sendCommand/set',
      JSON.stringify(mqttPayload),
    );

    // Assert position state has been updated
    assert.calledWith(gladys.device.saveState, zwaveJSUIHandler.devices[0].features[1], 99);
  });

  it('should set curtains multilevel switch currentvalue to 0 on state OPEN', async () => {
    const mqttClient = {
      publish: fake.returns(null),
    };

    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    zwaveJSUIHandler.mqttClient = mqttClient;
    zwaveJSUIHandler.devices = [
      {
        external_id: 'zwavejs-ui:6',
        features: [
          {
            category: 'switch',
            command_class: 38,
            command_class_name: 'Multilevel Switch',
            command_class_version: 4,
            endpoint: 0,
            external_id: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:state',
            feature_name: 'state',
            has_feedback: false,
            keep_history: true,
            max: 1,
            min: 0,
            name: '6-38-0-currentValue:state',
            node_id: 6,
            property_key_name: undefined,
            property_name: 'currentValue',
            read_only: false,
            selector: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:state',
            type: 'binary',
          },
          {
            category: 'switch',
            command_class: 38,
            command_class_name: 'Multilevel Switch',
            command_class_version: 4,
            endpoint: 0,
            external_id: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:position',
            feature_name: 'position',
            has_feedback: false,
            keep_history: true,
            max: 99,
            min: 0,
            name: '6-38-0-currentValue:position',
            node_id: 6,
            property_key_name: undefined,
            property_name: 'currentValue',
            read_only: false,
            selector: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:position',
            type: 'dimmer',
            unit: 'percent',
          },
        ],
        name: 'curtain-01',
        service_id: 'ffa13430-df93-488a-9733-5c540e9558e0',
      },
    ];
    zwaveJSUIHandler.zwaveJSDevices = [
      {
        id: 6,
        deviceClass: {
          basic: 4,
          generic: 17,
          specific: 6,
        },
      },
    ];

    await zwaveJSUIHandler.setValue(
      zwaveJSUIHandler.devices[0],
      zwaveJSUIHandler.devices[0].features[0],
      COVER_STATE.OPEN,
    );

    // Assert message published
    const mqttPayload = {
      args: [{ nodeId: 6, commandClass: 38, endpoint: 0 }, 'set', [0]],
    };
    assert.calledWith(
      mqttClient.publish,
      'zwave/_CLIENTS/ZWAVE_GATEWAY-zwave-js-ui/api/sendCommand/set',
      JSON.stringify(mqttPayload),
    );

    // Assert position state has been updated
    assert.calledWith(gladys.device.saveState, zwaveJSUIHandler.devices[0].features[1], 0);
  });

  it('should stop curtains multilevel switch on state STOP', async () => {
    const mqttClient = {
      publish: fake.returns(null),
    };

    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    zwaveJSUIHandler.mqttClient = mqttClient;
    zwaveJSUIHandler.devices = [
      {
        external_id: 'zwavejs-ui:6',
        features: [
          {
            category: 'switch',
            command_class: 38,
            command_class_name: 'Multilevel Switch',
            command_class_version: 4,
            endpoint: 0,
            external_id: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:state',
            feature_name: 'state',
            has_feedback: false,
            keep_history: true,
            max: 1,
            min: 0,
            name: '6-38-0-currentValue:state',
            node_id: 6,
            property_key_name: undefined,
            property_name: 'currentValue',
            read_only: false,
            selector: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:state',
            type: 'binary',
          },
          {
            category: 'switch',
            command_class: 38,
            command_class_name: 'Multilevel Switch',
            command_class_version: 4,
            endpoint: 0,
            external_id: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:position',
            feature_name: 'position',
            has_feedback: false,
            keep_history: true,
            max: 99,
            min: 0,
            name: '6-38-0-currentValue:position',
            node_id: 6,
            property_key_name: undefined,
            property_name: 'currentValue',
            read_only: false,
            selector: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:position',
            type: 'dimmer',
            unit: 'percent',
          },
        ],
        name: 'curtain-01',
        service_id: 'ffa13430-df93-488a-9733-5c540e9558e0',
      },
    ];
    zwaveJSUIHandler.zwaveJSDevices = [
      {
        id: 6,
        deviceClass: {
          basic: 4,
          generic: 17,
          specific: 7,
        },
      },
    ];

    await zwaveJSUIHandler.setValue(
      zwaveJSUIHandler.devices[0],
      zwaveJSUIHandler.devices[0].features[0],
      COVER_STATE.STOP,
    );

    // Assert message published
    const mqttPayload = {
      args: [{ nodeId: 6, commandClass: 38, endpoint: 0 }, 'stopLevelChange', []],
    };
    assert.calledWith(
      mqttClient.publish,
      'zwave/_CLIENTS/ZWAVE_GATEWAY-zwave-js-ui/api/sendCommand/set',
      JSON.stringify(mqttPayload),
    );

    // Asserts we do not try to update the position.
    assert.neverCalledWith(gladys.device.saveState, zwaveJSUIHandler.devices[0].features[1], sinon.match.any);
  });

  it('should set curtain multilevel switch currentvalue to value on position set to 0', async () => {
    const mqttClient = {
      publish: fake.returns(null),
    };

    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    zwaveJSUIHandler.mqttClient = mqttClient;
    zwaveJSUIHandler.devices = [
      {
        external_id: 'zwavejs-ui:6',
        features: [
          {
            category: 'switch',
            command_class: 38,
            command_class_name: 'Multilevel Switch',
            command_class_version: 4,
            endpoint: 0,
            external_id: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:state',
            feature_name: 'state',
            has_feedback: false,
            keep_history: true,
            max: 1,
            min: 0,
            name: '6-38-0-currentValue:state',
            node_id: 6,
            property_key_name: undefined,
            property_name: 'currentValue',
            read_only: false,
            selector: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:state',
            type: 'binary',
          },
          {
            category: 'switch',
            command_class: 38,
            command_class_name: 'Multilevel Switch',
            command_class_version: 4,
            endpoint: 0,
            external_id: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:position',
            feature_name: 'position',
            has_feedback: false,
            keep_history: true,
            max: 99,
            min: 0,
            name: '6-38-0-currentValue:position',
            node_id: 6,
            property_key_name: undefined,
            property_name: 'currentValue',
            read_only: false,
            selector: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:position',
            type: 'dimmer',
            unit: 'percent',
          },
        ],
        name: 'curtain-01',
        service_id: 'ffa13430-df93-488a-9733-5c540e9558e0',
      },
    ];
    zwaveJSUIHandler.zwaveJSDevices = [
      {
        id: 6,
        deviceClass: {
          basic: 4,
          generic: 17,
          specific: 6,
        },
      },
    ];

    await zwaveJSUIHandler.setValue(zwaveJSUIHandler.devices[0], zwaveJSUIHandler.devices[0].features[1], 0);

    // Assert message published
    const mqttPayload = {
      args: [{ nodeId: 6, commandClass: 38, endpoint: 0 }, 'set', [0]],
    };
    assert.calledWith(
      mqttClient.publish,
      'zwave/_CLIENTS/ZWAVE_GATEWAY-zwave-js-ui/api/sendCommand/set',
      JSON.stringify(mqttPayload),
    );

    // Assert state has not been updated
    assert.neverCalledWith(gladys.device.saveState, zwaveJSUIHandler.devices[0].features[0], sinon.match.any);
  });

  it('should set curtain multilevel switch currentvalue to value on positive position updated', async () => {
    const mqttClient = {
      publish: fake.returns(null),
    };

    const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, {}, serviceId);
    zwaveJSUIHandler.mqttClient = mqttClient;
    zwaveJSUIHandler.devices = [
      {
        external_id: 'zwavejs-ui:6',
        features: [
          {
            category: 'switch',
            command_class: 38,
            command_class_name: 'Multilevel Switch',
            command_class_version: 4,
            endpoint: 0,
            external_id: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:state',
            feature_name: 'state',
            has_feedback: false,
            keep_history: true,
            max: 1,
            min: 0,
            name: '6-38-0-currentValue:state',
            node_id: 6,
            property_key_name: undefined,
            property_name: 'currentValue',
            read_only: false,
            selector: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:state',
            type: 'binary',
          },
          {
            category: 'switch',
            command_class: 38,
            command_class_name: 'Multilevel Switch',
            command_class_version: 4,
            endpoint: 0,
            external_id: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:position',
            feature_name: 'position',
            has_feedback: false,
            keep_history: true,
            max: 99,
            min: 0,
            name: '6-38-0-currentValue:position',
            node_id: 6,
            property_key_name: undefined,
            property_name: 'currentValue',
            read_only: false,
            selector: 'zwavejs-ui:6:0:multilevel_switch:currentvalue:position',
            type: 'dimmer',
            unit: 'percent',
          },
        ],
        name: 'curtain-01',
        service_id: 'ffa13430-df93-488a-9733-5c540e9558e0',
      },
    ];
    zwaveJSUIHandler.zwaveJSDevices = [
      {
        id: 6,
        deviceClass: {
          basic: 4,
          generic: 17,
          specific: 6,
        },
      },
    ];

    await zwaveJSUIHandler.setValue(zwaveJSUIHandler.devices[0], zwaveJSUIHandler.devices[0].features[1], 42);

    // Assert message published
    const mqttPayload = {
      args: [{ nodeId: 6, commandClass: 38, endpoint: 0 }, 'set', [42]],
    };
    assert.calledWith(
      mqttClient.publish,
      'zwave/_CLIENTS/ZWAVE_GATEWAY-zwave-js-ui/api/sendCommand/set',
      JSON.stringify(mqttPayload),
    );

    // Assert state has not been updated
    assert.neverCalledWith(gladys.device.saveState, zwaveJSUIHandler.devices[0].features[0], sinon.match.any);
  });
});
