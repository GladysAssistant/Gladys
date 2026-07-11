const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;
const { MockedMqttClient } = require('../../mocks.test');
const { COVER_STATE } = require('../../../../../utils/constants');
const { buildHomeAssistantCommand } = require('../../../../../services/mqtt/lib/homeAssistant/setValueHomeAssistant');
const MqttHandler = require('../../../../../services/mqtt/lib');

const SERVICE_ID = 'faea9c35-759a-44d5-bcc9-2af1de37b8b4';

describe('mqttHandler.setValueHomeAssistant', () => {
  let mqttHandler;

  beforeEach(() => {
    mqttHandler = new MqttHandler({}, MockedMqttClient, SERVICE_ID);
    mqttHandler.publish = fake.returns(null);
  });

  afterEach(() => {
    sinon.reset();
  });

  const buildDevice = (params) => ({
    external_id: 'homeassistant:my-device',
    params,
  });

  it('should publish a switch command', async () => {
    const device = buildDevice([
      {
        name: 'ha_discovery_config:switch:relay',
        value: JSON.stringify({ command_topic: 'my-device/set' }),
      },
    ]);
    await mqttHandler.setValueHomeAssistant(device, { external_id: 'homeassistant:my-device:switch:relay' }, 1);
    assert.calledWith(mqttHandler.publish, 'my-device/set', 'ON');
    await mqttHandler.setValueHomeAssistant(device, { external_id: 'homeassistant:my-device:switch:relay' }, 0);
    assert.calledWith(mqttHandler.publish, 'my-device/set', 'OFF');
  });

  it('should throw when no entity configuration matches', async () => {
    const device = buildDevice([]);
    try {
      await mqttHandler.setValueHomeAssistant(device, { external_id: 'homeassistant:my-device:switch:relay' }, 1);
      expect.fail('should have thrown');
    } catch (e) {
      expect(e.message).to.include('no entity configuration found');
    }
  });

  it('should throw when the device has no params', async () => {
    try {
      await mqttHandler.setValueHomeAssistant(
        { external_id: 'homeassistant:my-device' },
        { external_id: 'homeassistant:my-device:switch:relay' },
        1,
      );
      expect.fail('should have thrown');
    } catch (e) {
      expect(e.message).to.include('no entity configuration found');
    }
  });

  it('should throw when there is no command topic', async () => {
    const device = buildDevice([
      {
        name: 'ha_discovery_config:sensor:temperature',
        value: JSON.stringify({ state_topic: 'my-device/temperature' }),
      },
    ]);
    try {
      await mqttHandler.setValueHomeAssistant(device, { external_id: 'homeassistant:my-device:sensor:temperature' }, 1);
      expect.fail('should have thrown');
    } catch (e) {
      expect(e.message).to.include('no command topic found');
    }
  });

  it('should pick the longest matching entity key', async () => {
    const device = buildDevice([
      {
        name: 'ha_discovery_config:light:main',
        value: JSON.stringify({ command_topic: 'main/set' }),
      },
      {
        name: 'ha_discovery_config:light:main:state',
        value: JSON.stringify({ command_topic: 'main-state/set' }),
      },
    ]);
    await mqttHandler.setValueHomeAssistant(device, { external_id: 'homeassistant:my-device:light:main:state' }, 1);
    // The most specific entity ("light:main:state") is picked, so this is its "state" property
    assert.calledWith(mqttHandler.publish, 'main-state/set', 'ON');
  });

  describe('buildHomeAssistantCommand', () => {
    it('should build default schema light commands', () => {
      const config = {
        command_topic: 'set',
        brightness_command_topic: 'brightness/set',
        color_temp_command_topic: 'color_temp/set',
        rgb_command_topic: 'rgb/set',
      };
      expect(buildHomeAssistantCommand('light', config, 'state', 1)).to.deep.equal({ topic: 'set', payload: 'ON' });
      expect(buildHomeAssistantCommand('light', config, 'state', 0)).to.deep.equal({ topic: 'set', payload: 'OFF' });
      expect(buildHomeAssistantCommand('light', config, 'brightness', 50.4)).to.deep.equal({
        topic: 'brightness/set',
        payload: '50',
      });
      expect(buildHomeAssistantCommand('light', config, 'color_temp', 300)).to.deep.equal({
        topic: 'color_temp/set',
        payload: '300',
      });
      expect(buildHomeAssistantCommand('light', config, 'color', 16711680)).to.deep.equal({
        topic: 'rgb/set',
        payload: '255,0,0',
      });
    });

    it('should build json schema light commands', () => {
      const config = { schema: 'json', command_topic: 'set' };
      expect(buildHomeAssistantCommand('light', config, 'state', 1)).to.deep.equal({
        topic: 'set',
        payload: JSON.stringify({ state: 'ON' }),
      });
      expect(buildHomeAssistantCommand('light', config, 'state', 0)).to.deep.equal({
        topic: 'set',
        payload: JSON.stringify({ state: 'OFF' }),
      });
      expect(buildHomeAssistantCommand('light', config, 'brightness', 128)).to.deep.equal({
        topic: 'set',
        payload: JSON.stringify({ state: 'ON', brightness: 128 }),
      });
      expect(buildHomeAssistantCommand('light', config, 'color_temp', 300)).to.deep.equal({
        topic: 'set',
        payload: JSON.stringify({ state: 'ON', color_temp: 300 }),
      });
      expect(buildHomeAssistantCommand('light', config, 'color', 65280)).to.deep.equal({
        topic: 'set',
        payload: JSON.stringify({ state: 'ON', color: { r: 0, g: 255, b: 0 } }),
      });
    });

    it('should build cover commands', () => {
      const config = { command_topic: 'set', set_position_topic: 'position/set' };
      expect(buildHomeAssistantCommand('cover', config, 'state', COVER_STATE.OPEN)).to.deep.equal({
        topic: 'set',
        payload: 'OPEN',
      });
      expect(buildHomeAssistantCommand('cover', config, 'state', COVER_STATE.CLOSE)).to.deep.equal({
        topic: 'set',
        payload: 'CLOSE',
      });
      expect(buildHomeAssistantCommand('cover', config, 'state', COVER_STATE.STOP)).to.deep.equal({
        topic: 'set',
        payload: 'STOP',
      });
      expect(buildHomeAssistantCommand('cover', config, 'position', 50)).to.deep.equal({
        topic: 'position/set',
        payload: '50',
      });
    });

    it('should scale cover positions with custom bounds', () => {
      const config = { set_position_topic: 'position/set', position_open: 200, position_closed: 100 };
      expect(buildHomeAssistantCommand('cover', config, 'position', 50)).to.deep.equal({
        topic: 'position/set',
        payload: '150',
      });
    });

    it('should build lock commands', () => {
      const config = { command_topic: 'set' };
      expect(buildHomeAssistantCommand('lock', config, 'state', 1)).to.deep.equal({ topic: 'set', payload: 'LOCK' });
      expect(buildHomeAssistantCommand('lock', config, 'state', 0)).to.deep.equal({
        topic: 'set',
        payload: 'UNLOCK',
      });
    });

    it('should build button commands', () => {
      const config = { command_topic: 'press' };
      expect(buildHomeAssistantCommand('button', config, 'state', 1)).to.deep.equal({
        topic: 'press',
        payload: 'PRESS',
      });
    });

    it('should build climate commands', () => {
      const config = { temperature_command_topic: 'target/set' };
      expect(buildHomeAssistantCommand('climate', config, 'target_temperature', 21.5)).to.deep.equal({
        topic: 'target/set',
        payload: '21.5',
      });
    });

    it('should return no topic for unsupported components', () => {
      expect(buildHomeAssistantCommand('vacuum', {}, 'state', 1)).to.deep.equal({
        topic: undefined,
        payload: undefined,
      });
    });
  });
});
