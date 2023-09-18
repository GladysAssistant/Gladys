const { expect } = require('chai');

const {
  getDeviceName,
  getDeviceExternalId,
  getDeviceFeatureName,
  getDeviceFeatureExternalId,
} = require('../../../../../services/sunspec/lib/utils/sunspec.externalId');

describe('SunSpec getStatus', () => {
  const manufacturer = 'manufacturer';
  const product = 'product';
  const serialNumber = 'serialNumber';
  const property = 'property';

  it('should getDeviceName AC', () => {
    const name = getDeviceName({
      manufacturer,
      product,
    });
    expect(name).to.be.equals('manufacturer product [AC]');
  });

  it('should getDeviceName DC', () => {
    const name = getDeviceName({
      manufacturer,
      product,
      mppt: 1,
    });
    expect(name).to.be.equals('manufacturer product [DC 1]');
  });

  it('should getDeviceExternalId AC', () => {
    const externalId = getDeviceExternalId({
      manufacturer,
      product,
      serialNumber,
    });
    expect(externalId).to.be.equals('sunspec:serialnumber:serialNumber:mppt:ac');
  });

  it('should getDeviceExternalId DC', () => {
    const externalId = getDeviceExternalId({
      manufacturer,
      product,
      serialNumber,
      mppt: 1,
    });
    expect(externalId).to.be.equals('sunspec:serialnumber:serialNumber:mppt:dc1');
  });

  it('should getDeviceFeatureName AC', () => {
    const name = getDeviceFeatureName({
      manufacturer,
      product,
      property,
    });
    expect(name).to.be.equals('manufacturer product [AC] - property');
  });

  it('should getDeviceFeatureName DC', () => {
    const name = getDeviceFeatureName({
      manufacturer,
      product,
      mppt: 1,
      property,
    });
    expect(name).to.be.equals('manufacturer product [DC 1] - property');
  });

  it('should getDeviceFeatureExternalId', () => {
    const externalId = getDeviceFeatureExternalId({
      manufacturer,
      product,
      serialNumber,
      property,
    });
    expect(externalId).to.be.equals('sunspec:serialnumber:serialNumber:mppt:ac:property:property');
  });
});
