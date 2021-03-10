const { expect } = require('chai');
const sinon = require('sinon');

const AwoxLegacyManager = require('../../../../../../services/awox/lib/handlers/legacy');

describe('awox.legacy.isSupportedDevice', () => {
  const bluetooth = {};
  const gladys = {};
  let manager;

  beforeEach(() => {
    manager = new AwoxLegacyManager(gladys, bluetooth);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('device not match any group', async () => {
    const device = {};

    const result = await manager.isSupportedDevice(device);

    expect(result).to.eq(false);
  });

  it('device not match model', async () => {
    const device = { model: 'unknown' };

    const result = await manager.isSupportedDevice(device);

    expect(result).to.eq(false);
  });

  it('device not match name', async () => {
    const device = { name: 'unknown' };

    const result = await manager.isSupportedDevice(device);

    expect(result).to.eq(false);
  });

  it('device model matches', async () => {
    const device = { model: 'SML-w7', name: 'none' };

    const result = await manager.isSupportedDevice(device);

    expect(result).to.eq(true);
  });

  it('device name matches', async () => {
    const device = { name: 'SML-w7' };

    const result = await manager.isSupportedDevice(device);

    expect(result).to.eq(true);
  });
});
