module.exports = {
  name: "Clim Salle d'attente",
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
    featureExternalId: 'tuya:bf5638fc7cc3f25e32i45q:horizontal',
    inputValue: 2,
    expectedLocalSet: {
      dps: 106,
      set: 'opposite',
    },
    expectedCloudRequests: 0,
  },
};
