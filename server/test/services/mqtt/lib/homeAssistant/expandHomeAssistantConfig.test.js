const { expect } = require('chai');

const {
  expandHomeAssistantConfig,
} = require('../../../../../services/mqtt/lib/homeAssistant/expandHomeAssistantConfig');

describe('mqttHandler.homeAssistant.expandHomeAssistantConfig', () => {
  it('should expand abbreviated keys', () => {
    const expanded = expandHomeAssistantConfig({
      name: 'Temperature',
      uniq_id: 'temp1',
      stat_t: 'my-device/temperature',
      dev_cla: 'temperature',
      unit_of_meas: '°C',
      val_tpl: '{{ value_json.temperature }}',
      custom_key: 'untouched',
    });
    expect(expanded).to.deep.equal({
      name: 'Temperature',
      unique_id: 'temp1',
      state_topic: 'my-device/temperature',
      device_class: 'temperature',
      unit_of_measurement: '°C',
      value_template: '{{ value_json.temperature }}',
      custom_key: 'untouched',
    });
  });

  it('should expand device and origin objects', () => {
    const expanded = expandHomeAssistantConfig({
      dev: {
        ids: ['0x1234'],
        mf: 'Sonoff',
        mdl: 'Basic',
        name: 'My device',
      },
      o: {
        name: 'my-firmware',
        sw: '1.0',
        url: 'https://example.com',
      },
    });
    expect(expanded.device).to.deep.equal({
      identifiers: ['0x1234'],
      manufacturer: 'Sonoff',
      model: 'Basic',
      name: 'My device',
    });
    expect(expanded.origin).to.deep.equal({
      name: 'my-firmware',
      sw_version: '1.0',
      support_url: 'https://example.com',
    });
  });

  it('should expand availability array', () => {
    const expanded = expandHomeAssistantConfig({
      avty: [{ t: 'my-device/availability', pl_avail: 'online', pl_not_avail: 'offline' }],
    });
    expect(expanded.availability).to.deep.equal([
      { topic: 'my-device/availability', payload_available: 'online', payload_not_available: 'offline' },
    ]);
  });

  it('should replace the base topic at the beginning and end of topics', () => {
    const expanded = expandHomeAssistantConfig({
      '~': 'my-device',
      stat_t: '~/state',
      cmd_t: 'set/~',
      pos_t: 'other/topic',
      name: '~not-a-topic',
    });
    expect(expanded.state_topic).to.equal('my-device/state');
    expect(expanded.command_topic).to.equal('set/my-device');
    expect(expanded.position_topic).to.equal('other/topic');
    expect(expanded.name).to.equal('~not-a-topic');
  });
});
