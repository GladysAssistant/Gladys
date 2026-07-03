const { expect } = require('chai');
const db = require('../../models');
const { getFeaturesInclude, getStandardDeviceIncludes } = require('../../utils/deviceQueryIncludes');

describe('deviceQueryIncludes', () => {
  it('should return default features include', () => {
    const include = getFeaturesInclude();

    expect(include.model).to.equal(db.DeviceFeature);
    expect(include.as).to.equal('features');
    expect(include.include).to.have.lengthOf(1);
    expect(include.include[0].model).to.equal(db.DeviceFeatureSupportedOption);
    expect(include.include[0].as).to.equal('supported_options');
    expect(include.where).to.equal(undefined);
    expect(include.attributes).to.equal(undefined);
  });

  it('should return features include with where and attributes', () => {
    const include = getFeaturesInclude({
      where: { category: 'light' },
      attributes: ['name', 'selector'],
    });

    expect(include.where).to.deep.equal({ category: 'light' });
    expect(include.attributes).to.deep.equal(['name', 'selector']);
  });

  it('should return standard device includes', () => {
    const includes = getStandardDeviceIncludes({
      where: { category: 'light' },
    });

    expect(includes).to.have.lengthOf(4);
    expect(includes[0].as).to.equal('features');
    expect(includes[0].where).to.deep.equal({ category: 'light' });
    expect(includes[1].as).to.equal('params');
    expect(includes[2].as).to.equal('room');
    expect(includes[3].as).to.equal('service');
  });
});
