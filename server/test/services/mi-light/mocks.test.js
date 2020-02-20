const MockedMiLightClient = {
  discoverBridges: () =>
    Promise.resolve([
      {
        name: 'Mi Light Bridge',
        ip: '192.168.10.245',
        mac: '00:1b:44:11:3a:b7',
        type: 'v6',
      },
    ]),
};

module.exports = MockedMiLightClient;
