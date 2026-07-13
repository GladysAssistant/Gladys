const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;
const { MockedMqttClient } = require('../../mocks.test');
const { EVENTS, STATE, COVER_STATE } = require('../../../../../utils/constants');
const {
  parseHomeAssistantIncomingState,
  rgbToInt,
  toBinaryState,
  toNumber,
} = require('../../../../../services/mqtt/lib/homeAssistant/handleHomeAssistantStateMessage');
const MqttHandler = require('../../../../../services/mqtt/lib');

const SERVICE_ID = 'faea9c35-759a-44d5-bcc9-2af1de37b8b4';

describe('mqttHandler.handleHomeAssistantStateMessage', () => {
  let mqttHandler;
  let gladys;

  beforeEach(() => {
    gladys = {
      event: {
        emit: fake.returns(null),
      },
    };
    mqttHandler = new MqttHandler(gladys, MockedMqttClient, SERVICE_ID);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should do nothing when no binding exists for the topic', () => {
    mqttHandler.handleHomeAssistantStateMessage('unknown/topic', 'ON');
    assert.notCalled(gladys.event.emit);
  });

  it('should emit a new state event', () => {
    mqttHandler.haStateBindings['my-device/temperature'] = [
      {
        deviceExternalId: 'homeassistant:my-device',
        featureExternalId: 'homeassistant:my-device:sensor:temperature',
        component: 'sensor',
        property: 'state',
        config: { state_topic: 'my-device/temperature' },
      },
    ];
    mqttHandler.handleHomeAssistantStateMessage('my-device/temperature', '21.5');
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'homeassistant:my-device:sensor:temperature',
      state: 21.5,
    });
  });

  it('should not emit when the state cannot be parsed', () => {
    mqttHandler.haStateBindings['my-device/temperature'] = [
      {
        featureExternalId: 'homeassistant:my-device:sensor:temperature',
        component: 'sensor',
        property: 'state',
        config: {},
      },
    ];
    mqttHandler.handleHomeAssistantStateMessage('my-device/temperature', 'not-a-number');
    assert.notCalled(gladys.event.emit);
  });

  it('should catch errors while parsing', () => {
    mqttHandler.haStateBindings['my-device/temperature'] = [
      {
        featureExternalId: 'homeassistant:my-device:sensor:temperature',
        component: 'sensor',
        property: 'state',
        config: null,
      },
    ];
    mqttHandler.handleHomeAssistantStateMessage('my-device/temperature', '21.5');
    assert.notCalled(gladys.event.emit);
  });

  describe('parseHomeAssistantIncomingState', () => {
    it('should parse a sensor value with a value template', () => {
      const state = parseHomeAssistantIncomingState(
        {
          component: 'sensor',
          property: 'state',
          config: { value_template: '{{ value_json.temperature }}' },
        },
        '{"temperature": 21.5}',
      );
      expect(state).to.equal(21.5);
    });

    it('should parse a binary sensor with custom payloads', () => {
      const binding = { component: 'binary_sensor', property: 'state', config: { payload_on: 'yes' } };
      expect(parseHomeAssistantIncomingState(binding, 'yes')).to.equal(STATE.ON);
      expect(parseHomeAssistantIncomingState(binding, 'OFF')).to.equal(STATE.OFF);
      expect(parseHomeAssistantIncomingState(binding, 'unknown')).to.equal(undefined);
    });

    it('should parse a switch with state_on/state_off', () => {
      const binding = { component: 'switch', property: 'state', config: { state_on: '1', state_off: '0' } };
      expect(parseHomeAssistantIncomingState(binding, '1')).to.equal(STATE.ON);
      expect(parseHomeAssistantIncomingState(binding, '0')).to.equal(STATE.OFF);
    });

    it('should parse a lock state', () => {
      const binding = { component: 'lock', property: 'state', config: {} };
      expect(parseHomeAssistantIncomingState(binding, 'LOCKED')).to.equal(STATE.ON);
      expect(parseHomeAssistantIncomingState(binding, 'UNLOCKED')).to.equal(STATE.OFF);
    });

    it('should parse climate temperatures', () => {
      expect(
        parseHomeAssistantIncomingState({ component: 'climate', property: 'target_temperature', config: {} }, '21.5'),
      ).to.equal(21.5);
      expect(
        parseHomeAssistantIncomingState({ component: 'climate', property: 'current_temperature', config: {} }, '19'),
      ).to.equal(19);
    });

    it('should return undefined for unknown components', () => {
      expect(parseHomeAssistantIncomingState({ component: 'vacuum', property: 'state', config: {} }, '1')).to.equal(
        undefined,
      );
    });

    describe('light', () => {
      it('should parse a json schema light state', () => {
        const config = { schema: 'json' };
        expect(
          parseHomeAssistantIncomingState({ component: 'light', property: 'state', config }, '{"state":"ON"}'),
        ).to.equal(STATE.ON);
        expect(
          parseHomeAssistantIncomingState(
            { component: 'light', property: 'brightness', config },
            '{"state":"ON","brightness":128}',
          ),
        ).to.equal(128);
        expect(
          parseHomeAssistantIncomingState(
            { component: 'light', property: 'color_temp', config },
            '{"state":"ON","color_temp":300}',
          ),
        ).to.equal(300);
        expect(
          parseHomeAssistantIncomingState(
            { component: 'light', property: 'color', config },
            '{"color":{"r":255,"g":0,"b":0}}',
          ),
        ).to.equal(16711680);
        expect(
          parseHomeAssistantIncomingState({ component: 'light', property: 'color', config }, '{"state":"ON"}'),
        ).to.equal(undefined);
        expect(
          parseHomeAssistantIncomingState({ component: 'light', property: 'state', config }, 'not-a-json'),
        ).to.equal(undefined);
      });

      it('should parse a default schema light state', () => {
        const config = {};
        expect(parseHomeAssistantIncomingState({ component: 'light', property: 'state', config }, 'ON')).to.equal(
          STATE.ON,
        );
        expect(parseHomeAssistantIncomingState({ component: 'light', property: 'brightness', config }, '128')).to.equal(
          128,
        );
        expect(parseHomeAssistantIncomingState({ component: 'light', property: 'color_temp', config }, '300')).to.equal(
          300,
        );
        expect(parseHomeAssistantIncomingState({ component: 'light', property: 'color', config }, '0,255,0')).to.equal(
          65280,
        );
      });
    });

    describe('cover', () => {
      it('should parse cover states', () => {
        const binding = { component: 'cover', property: 'state', config: {} };
        expect(parseHomeAssistantIncomingState(binding, 'open')).to.equal(COVER_STATE.OPEN);
        expect(parseHomeAssistantIncomingState(binding, 'opening')).to.equal(COVER_STATE.OPEN);
        expect(parseHomeAssistantIncomingState(binding, 'closed')).to.equal(COVER_STATE.CLOSE);
        expect(parseHomeAssistantIncomingState(binding, 'closing')).to.equal(COVER_STATE.CLOSE);
        expect(parseHomeAssistantIncomingState(binding, 'stopped')).to.equal(COVER_STATE.STOP);
        expect(parseHomeAssistantIncomingState(binding, 'unknown')).to.equal(undefined);
      });

      it('should parse cover states with custom payloads', () => {
        const binding = { component: 'cover', property: 'state', config: { state_open: 'OPENED' } };
        expect(parseHomeAssistantIncomingState(binding, 'OPENED')).to.equal(COVER_STATE.OPEN);
      });

      it('should parse a cover position', () => {
        const binding = { component: 'cover', property: 'position', config: {} };
        expect(parseHomeAssistantIncomingState(binding, '40')).to.equal(40);
        expect(parseHomeAssistantIncomingState(binding, 'not-a-number')).to.equal(undefined);
      });

      it('should scale a cover position with custom bounds', () => {
        const binding = {
          component: 'cover',
          property: 'position',
          config: { position_open: 200, position_closed: 100 },
        };
        expect(parseHomeAssistantIncomingState(binding, '150')).to.equal(50);
      });

      it('should return undefined when position bounds are equal', () => {
        const binding = {
          component: 'cover',
          property: 'position',
          config: { position_open: 100, position_closed: 100 },
        };
        expect(parseHomeAssistantIncomingState(binding, '100')).to.equal(undefined);
      });
    });
  });

  describe('rgbToInt', () => {
    it('should convert from string, array and object', () => {
      expect(rgbToInt('255,255,255')).to.equal(16777215);
      expect(rgbToInt([0, 0, 255])).to.equal(255);
      expect(rgbToInt({ r: 0, g: 255, b: 0 })).to.equal(65280);
    });
    it('should return undefined on invalid colors', () => {
      expect(rgbToInt('255,abc,0')).to.equal(undefined);
      expect(rgbToInt(12)).to.equal(undefined);
    });
  });

  describe('toBinaryState', () => {
    it('should compare with payloads', () => {
      expect(toBinaryState('ON', 'ON', 'OFF')).to.equal(STATE.ON);
      expect(toBinaryState('OFF', 'ON', 'OFF')).to.equal(STATE.OFF);
      expect(toBinaryState('other', 'ON', 'OFF')).to.equal(undefined);
    });
  });

  describe('toNumber', () => {
    it('should convert values to numbers', () => {
      expect(toNumber('12.5')).to.equal(12.5);
      expect(toNumber(undefined)).to.equal(undefined);
      expect(toNumber(null)).to.equal(undefined);
      expect(toNumber('')).to.equal(undefined);
      expect(toNumber('abc')).to.equal(undefined);
    });
  });
});
