module.exports = {
  name: 'Production solaire',
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
};
