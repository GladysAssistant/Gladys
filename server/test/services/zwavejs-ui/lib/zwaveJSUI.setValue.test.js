const sinon = require('sinon');
const { expect } = require('chai');

const { assert, fake } = sinon;

const ZwaveJSUIHandler = require('../../../../services/zwavejs-ui/lib');
const { BadParameters } = require('../../../../utils/coreErrors');
const { STATE } = require('../../../../utils/constants');

const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

const gladys = {
  variable: {
    getValue: fake.resolves('toto'),
  },
  event: {
    emit: fake.returns(null),
  },
};

describe('zwaveJSUIHandler.setValue', () => {
  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should fail on unknown node', async () => {
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
    try {
      await zwaveJSUIHandler.setValue(
        { external_id: 'zwavejs-ui:2' },
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
    try {
      await zwaveJSUIHandler.setValue(
        { external_id: 'zwavejs-ui:2' },
        {
          external_id: 'zwavejs-ui:2:0:notification:access_control:door_state_simple',
        },
        '1',
      );
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

    await zwaveJSUIHandler.setValue(
      { external_id: 'zwavejs-ui:3' },
      { external_id: 'zwavejs-ui:3:0:binary_switch:currentvalue' },
      STATE.OFF,
    );

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

    await zwaveJSUIHandler.setValue(
      { external_id: 'zwavejs-ui:3' },
      { external_id: 'zwavejs-ui:3:0:binary_switch:currentvalue' },
      STATE.ON,
    );

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

    try {
      await zwaveJSUIHandler.setValue(
        { external_id: 'zwavejs-ui:3' },
        { external_id: 'zwavejs-ui:3:0:binary_switch:currentvalue' },
        4,
      );
    } catch (e) {
      expect(e).instanceOf(BadParameters);

      return;
    }

    assert.fail();
  });
});
