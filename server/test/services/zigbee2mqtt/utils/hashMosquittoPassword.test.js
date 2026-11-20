const crypto = require('crypto');
const { expect } = require('chai');

const { hashMosquittoPassword } = require('../../../../services/zigbee2mqtt/utils/hashMosquittoPassword');

describe('zigbee2mqtt hashMosquittoPassword', () => {
  it('should hash the password like mosquitto_passwd', () => {
    // EXECUTE
    const hashedPassword = hashMosquittoPassword('my-password');
    // ASSERT
    const [empty, scheme, iterations, salt, hash] = hashedPassword.split('$');
    expect(empty).to.equal('');
    expect(scheme).to.equal('7');
    expect(iterations).to.equal('101');
    const saltBytes = Buffer.from(salt, 'base64');
    expect(saltBytes).to.have.lengthOf(12);
    expect(salt).to.equal(saltBytes.toString('base64'));
    const expectedHash = crypto.pbkdf2Sync('my-password', saltBytes, 101, 64, 'sha512').toString('base64');
    expect(hash).to.equal(expectedHash);
  });

  it('should salt each hash differently', () => {
    expect(hashMosquittoPassword('my-password')).to.not.equal(hashMosquittoPassword('my-password'));
  });
});
