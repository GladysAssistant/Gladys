module.exports = {
  name: 'Thermostat Bureau Psycho',
  convertDevice: {
    input: './input-device.json',
    expected: './expected-device.json',
  },
  pollCloud: {
    device: './poll-device.json',
    response: './cloud-status.json',
    expectedEvents: './expected-events.json',
  },
  pollLocal: {
    device: './poll-device.json',
    dps: './local-dps.json',
    expectedEvents: './expected-events.json',
    expectedCloudRequests: 0,
  },
  localMapping: {
    device: './poll-device.json',
    expected: './expected-local-mapping.json',
  },
  setValueLocal: {
    device: './poll-device.json',
    featureExternalId: 'tuya:bfc3c1dcdd95241afal8mo:mode',
    inputValue: 6,
    expectedLocalSet: {
      dps: 101,
      set: 'Programming',
    },
    expectedCloudRequests: 0,
  },
};
