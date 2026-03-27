module.exports = {
  name: 'smart socket basic',
  convertDevice: {
    input: './input-device.json',
    expected: './expected-device.json',
  },
  pollCloud: {
    device: './poll-device.json',
    response: './cloud-status.json',
    expectedEvents: './expected-cloud-events.json',
  },
  pollLocal: {
    device: './poll-device.json',
    dps: './local-dps.json',
    expectedEvents: './expected-local-events.json',
    expectedCloudRequests: 1,
  },
  localMapping: {
    device: './poll-device.json',
    expected: './expected-local-mapping.json',
  },
  setValueLocal: {
    device: './poll-device.json',
    featureExternalId: 'tuya:socket-device-id:switch_1',
    inputValue: 1,
    expectedLocalSet: {
      dps: 1,
      set: true,
    },
    expectedCloudRequests: 0,
  },
};
