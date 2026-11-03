const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const config = require('../../../../services/matter-bridge/lib/config');
const { VARIABLES } = require('../../../../services/matter-bridge/lib/constants');

describe('Matter bridge config', () => {
  afterEach(() => {
    sinon.restore();
    delete process.env.MATTER_BRIDGE_FOLDER_PATH;
  });

  it('should store the bridge next to the database, unless told otherwise', () => {
    expect(config.getStoragePath({ config: { storage: '/var/lib/gladysassistant/gladys.db' } })).to.equal(
      '/var/lib/gladysassistant/matter-bridge',
    );
    process.env.MATTER_BRIDGE_FOLDER_PATH = '/tmp/bridge';
    expect(config.getStoragePath({ config: { storage: '/db' } })).to.equal('/tmp/bridge');
  });

  it('should validate passcodes', () => {
    expect(config.isValidPasscode(20202021)).to.equal(true);
    expect(config.isValidPasscode(12345678)).to.equal(false);
    expect(config.isValidPasscode(11111111)).to.equal(false);
    expect(config.isValidPasscode(0)).to.equal(false);
    expect(config.isValidPasscode(99999999)).to.equal(false);
    expect(config.isValidPasscode(NaN)).to.equal(false);
  });

  it('should draw passcodes until a valid one', () => {
    const randomInt = sinon.stub();
    randomInt.onFirstCall().returns(12345678);
    randomInt.onSecondCall().returns(20202021);
    expect(config.generatePasscode(randomInt)).to.equal(20202021);
    expect(config.isValidPasscode(config.generatePasscode())).to.equal(true);
  });

  it('should create the pairing configuration on the first start', async () => {
    const gladys = { variable: { getValue: sinon.stub().resolves(null), setValue: sinon.stub().resolves() } };
    const { passcode, discriminator, serialNumber } = await config.getPairingConfig(gladys, 'service');
    expect(config.isValidPasscode(passcode)).to.equal(true);
    expect(discriminator).to.be.within(0, 4095);
    expect(serialNumber).to.match(/^[0-9a-f]{16}$/);
    sinon.assert.calledWith(gladys.variable.setValue, VARIABLES.PASSCODE, String(passcode), 'service');
    sinon.assert.calledWith(gladys.variable.setValue, VARIABLES.DISCRIMINATOR, String(discriminator), 'service');
    sinon.assert.calledWith(gladys.variable.setValue, VARIABLES.SERIAL_NUMBER, serialNumber, 'service');
  });

  it('should keep the stored pairing configuration', async () => {
    const stored = {
      [VARIABLES.PASSCODE]: '20202021',
      [VARIABLES.DISCRIMINATOR]: '3840',
      [VARIABLES.SERIAL_NUMBER]: 'abc',
    };
    const gladys = {
      variable: { getValue: sinon.stub().callsFake(async (name) => stored[name]), setValue: sinon.stub().resolves() },
    };
    expect(await config.getPairingConfig(gladys, 'service')).to.deep.equal({
      passcode: 20202021,
      discriminator: 3840,
      serialNumber: 'abc',
    });
    sinon.assert.notCalled(gladys.variable.setValue);
  });

  it('should turn the Gladys version into a Matter software version', () => {
    expect(config.softwareVersionOf('v4.70.1')).to.deep.equal({
      softwareVersion: 47001,
      softwareVersionString: '4.70.1',
    });
    expect(config.softwareVersionOf(undefined)).to.deep.equal({ softwareVersion: 1, softwareVersionString: '1' });
  });

  it('should derive a unique id different from the serial number', () => {
    const uniqueId = config.uniqueIdOf('abc');
    expect(uniqueId).to.have.lengthOf(32);
    expect(uniqueId).to.not.equal('abc');
    expect(config.uniqueIdOf('abc')).to.equal(uniqueId);
  });
});
