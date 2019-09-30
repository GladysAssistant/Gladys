/*  
    case 'sensor_wleak.aq1':
      this.newValueLeak(message, data);
      break;
    case 'plug':
      this.newValuePlug(message, data);
      break;
    case 'ctrl_neutral1':
      this.newValueSingleWiredSwitch(message, data);
      break;
    case 'ctrl_neutral2':
      this.newValueDuplexWiredSwitch(message, data);
      break;
    case 'ctrl_ln1.aq1':
    case 'ctrl_ln1':
      this.newValueSingleWiredSwitchNeutral(message, data);
      break;
    case 'ctrl_ln2.aq1':
    case 'ctrl_ln2':
      this.newValueDuplexWiredSwitchNeutral(message, data);
      break;
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
      status: 'flip',
    }),
  },
  {
    sid: `1245${(counter += 1)}`,
    model: 'sensor_cube.aqgl01',
    data: JSON.stringify({
      rotate: 10,
    }),
  },
  // SWITCH
  {
    sid: `1245${(counter += 1)}`,
    model: 'switch',
    data: JSON.stringify({
      status: 'click',
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
];

module.exports = MESSAGES;
