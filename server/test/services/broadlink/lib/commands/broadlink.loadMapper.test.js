const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const gladys = {};
const broadlink = {};
const serviceId = 'dc96648e-45f7-4b67-9f45-493fd114450f';

describe('broadlink.device.createDevice', () => {
  let broadlinkHandler;

  class Remote {}
  class Light {}

  const remoteTypes = { Remote };
  const lightTypes = { Light };
  const remoteMapper = {
    deviceClasses: remoteTypes,
    canLearn: true,
  };
  const lightMapper = {
    deviceClasses: lightTypes,
  };
  const deviceMappers = [remoteMapper, lightMapper];

  const proxyBuildPeripheral = proxyquire('../../../../../services/broadlink/lib/commands/broadlink.loadMapper', {
    './features': { DEVICE_MAPPERS: deviceMappers },
  });

  const BroadlinkHandler = proxyquire('../../../../../services/broadlink/lib', {
    './commands/broadlink.loadMapper': proxyBuildPeripheral,
  });

  beforeEach(() => {
    broadlinkHandler = new BroadlinkHandler(gladys, broadlink, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('device not managed', () => {
    // Not managed type
    const broadlinkDevice = new Error();
    const deviceMapper = broadlinkHandler.loadMapper(broadlinkDevice);
    expect(deviceMapper).to.eq(undefined);
  });

  it('should match remote mapper', () => {
    const broadlinkDevice = new Remote();
    const deviceMapper = broadlinkHandler.loadMapper(broadlinkDevice);
    expect(deviceMapper).to.deep.eq(remoteMapper);
  });

  it('should match light mapper', () => {
    const broadlinkDevice = new Light();
    const deviceMapper = broadlinkHandler.loadMapper(broadlinkDevice);
    expect(deviceMapper).to.deep.eq(lightMapper);
  });
});
