/*
    case '86sw2':
      this.newValueDuplexWirelessSwitch(message, data);
      break;
    case '86sw1':
      this.newValueSingleWirelessSwitch(message, data);
      break; */

let counter = 0;
const MESSAGES = [
  // GATEWAY
  {
    sid: `1245${(counter += 1)}`,
    model: 'gateway',
    cmd: 'heartbeat',
    token: 'aeiazisjflkj',
    data: JSON.stringify({
      illumination: 12,
    }),
  },
  // MOTION SENSOR
  {
    sid: `1245${(counter += 1)}`,
    model: 'motion',
    data: JSON.stringify({
      status: 'motion',
    }),
  },
  {
    sid: `1245${(counter += 1)}`,
    model: 'sensor_motion.aq2',
    data: JSON.stringify({
      no_motion: 1,
      lux: 10,
      voltage: 3000,
    }),
  },
  // MAGNET
  {
    sid: `1245${(counter += 1)}`,
    model: 'sensor_magnet.aq2',
    data: JSON.stringify({
      status: 'open',
      voltage: 3000,
    }),
  },
  {
    sid: `1245${(counter += 1)}`,
    model: 'magnet',
    data: JSON.stringify({
      status: 'close',
      voltage: 3000,
    }),
  },
  // TEMPERATURE
  {
    sid: `1245${(counter += 1)}`,
    model: 'sensor_ht',
    data: JSON.stringify({
      temperature: 20,
      humidity: 1,
      voltage: 3000,
    }),
  },
  {
    sid: `1245${(counter += 1)}`,
    model: 'weather.v1',
    data: JSON.stringify({
      pressure: 1000,
      voltage: 3000,
    }),
  },
  // CUBE
  {
    sid: `1245${(counter += 1)}`,
    model: 'sensor_cube.aqgl01',
    data: JSON.stringify({
      voltage: 5000,
      status: 'tap_twice',
    }),
  },
  {
    sid: `1245${(counter += 1)}`,
    model: 'sensor_cube.aqgl01',
    data: JSON.stringify({
      voltage: 100,
      rotate: 10,
    }),
  },
  // SWITCH
  {
    sid: `1245${(counter += 1)}`,
    model: 'sensor_switch.aq2',
    data: JSON.stringify({
      status: 'click',
      voltage: 3000,
    }),
  },
  {
    sid: `1245${(counter += 1)}`,
    model: 'switch',
    data: JSON.stringify({
      status: 'click',
      voltage: 3000,
    }),
  },
  // SMOKE
  {
    sid: `1245${(counter += 1)}`,
    model: 'smoke',
    data: JSON.stringify({
      alarm: 1,
      status: 1,
      density: 5,
      voltage: 3000,
    }),
  },
  // VIBRATION
  {
    sid: `1245${(counter += 1)}`,
    model: 'vibration',
    data: JSON.stringify({
      status: 'vibrate',
      voltage: 3000,
      bed_activity: 10,
      final_tilt_angle: 12,
      coordination: '10,10,10',
    }),
  },
  // LEAK
  {
    sid: `1245${(counter += 1)}`,
    model: 'sensor_wleak.aq1',
    data: JSON.stringify({
      status: 'leak',
      voltage: 3000,
    }),
  },
  {
    sid: `1245${(counter += 1)}`,
    model: 'sensor_wleak.aq1',
    data: JSON.stringify({
      status: 'no_leak',
      voltage: 3000,
    }),
  },
  // PLUG
  {
    sid: `1245${(counter += 1)}`,
    model: 'plug',
    data: JSON.stringify({
      status: 'on',
      load_power: 100,
      power_consumed: 10000,
      inuse: 1,
    }),
  },
  {
    sid: `1245${(counter += 1)}`,
    model: 'plug',
    data: JSON.stringify({
      status: 'off',
      load_power: 100,
      power_consumed: 10000,
    }),
  },
  // SINGLE WIRED SWITCH
  {
    sid: `1245${(counter += 1)}`,
    model: 'ctrl_neutral1',
    data: JSON.stringify({
      channel_0: 'on',
    }),
  },
  {
    sid: `1245${(counter += 1)}`,
    model: 'ctrl_neutral1',
    data: JSON.stringify({
      channel_0: 'off',
    }),
  },
  // DUPLEX WIRED SWITCH
  {
    sid: `1245${(counter += 1)}`,
    model: 'ctrl_neutral2',
    data: JSON.stringify({
      channel_0: 'on',
      channel_1: 'on',
    }),
  },
  {
    sid: `1245${(counter += 1)}`,
    model: 'ctrl_neutral2',
    data: JSON.stringify({
      channel_0: 'off',
      channel_1: 'off',
    }),
  },
  // SINGLE WIRED SWITCH NEUTRAL
  {
    sid: `1245${(counter += 1)}`,
    model: 'ctrl_ln1.aq1',
    data: JSON.stringify({
      channel_0: 'on',
    }),
  },
  {
    sid: `1245${(counter += 1)}`,
    model: 'ctrl_ln1',
    data: JSON.stringify({
      channel_0: 'off',
    }),
  },
  // DUPLEX WIRED SWITCH NEUTRAL
  {
    sid: `1245${(counter += 1)}`,
    model: 'ctrl_ln2.aq1',
    data: JSON.stringify({
      channel_0: 'on',
      channel_1: 'on',
    }),
  },
  {
    sid: `1245${(counter += 1)}`,
    model: 'ctrl_ln2',
    data: JSON.stringify({
      channel_0: 'off',
      channel_1: 'off',
    }),
  },
  // DUPLEX WIRELESS SWITCH
  {
    sid: `1245${(counter += 1)}`,
    model: '86sw2',
    data: JSON.stringify({
      voltage: 3000,
      channel_0: 'click',
      channel_1: 'click',
      dual_channel: 'click',
    }),
  },
  // SINGLE WIRELESS SWITCH
  {
    sid: `1245${(counter += 1)}`,
    model: '86sw1',
    data: JSON.stringify({
      voltage: 3000,
      channel_0: 'click',
    }),
  },
  // unknown
  {
    sid: `1245${(counter += 1)}`,
    model: 'unknown-device',
    data: JSON.stringify({
      voltage: 3000,
      channel_0: 'click',
    }),
  },
];

module.exports = MESSAGES;
