const { expect } = require('chai');

const {
  isExistingNodeRedUser,
  resolveNodeRedMajorVersion,
  getNodeRedDockerImage,
  containerMatchesMajorVersion,
} = require('../../../../services/node-red/lib/nodeRedVersion');
const { DEFAULT } = require('../../../../services/node-red/lib/constants');

describe('NodeRed nodeRedVersion', () => {
  it('should detect existing users from stored credentials', () => {
    expect(isExistingNodeRedUser({ nodeRedUsername: 'admin' })).to.equal(true);
    expect(isExistingNodeRedUser({ nodeRedPassword: 'secret' })).to.equal(true);
    expect(isExistingNodeRedUser({})).to.equal(false);
  });

  it('should keep a valid stored major version', () => {
    expect(resolveNodeRedMajorVersion({ dockerNodeRedVersion: '4' })).to.equal('4');
  });

  it('should default existing users to version 3', () => {
    expect(
      resolveNodeRedMajorVersion({
        nodeRedUsername: 'admin',
      }),
    ).to.equal(DEFAULT.NODE_RED_MAJOR_VERSION_EXISTING);
  });

  it('should default new users to version 5', () => {
    expect(resolveNodeRedMajorVersion({})).to.equal(DEFAULT.NODE_RED_MAJOR_VERSION_NEW);
  });

  it('should return docker image for a major version', () => {
    expect(getNodeRedDockerImage('5')).to.equal('nodered/node-red:5.0');
  });

  it('should reject invalid major versions', () => {
    expect(() => getNodeRedDockerImage('99')).to.throw('NODE_RED_INVALID_MAJOR_VERSION: 99');
  });

  it('should match container image with selected major version', () => {
    expect(containerMatchesMajorVersion('nodered/node-red:3.1', '3')).to.equal(true);
    expect(containerMatchesMajorVersion('registry.io/nodered/node-red:3.1', '3')).to.equal(true);
    expect(containerMatchesMajorVersion('nodered/node-red:5.0', '3')).to.equal(false);
  });
});
