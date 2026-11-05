const { expect } = require('chai');

const { VARIABLES, EXPOSURE_MODES, MOVEMENT_STATUS } = require('../../../../services/matter-bridge/lib/constants');

describe('Matter bridge constants', () => {
  // The names of the variables are stored in the database: changing one loses the setting.
  it('should keep the names the settings are stored under', () => {
    expect(VARIABLES).to.deep.equal({
      ENABLED: 'MATTER_BRIDGE_ENABLED',
      PASSCODE: 'MATTER_BRIDGE_PASSCODE',
      DISCRIMINATOR: 'MATTER_BRIDGE_DISCRIMINATOR',
      SERIAL_NUMBER: 'MATTER_BRIDGE_SERIAL_NUMBER',
      EXPOSURE_MODE: 'MATTER_BRIDGE_EXPOSURE_MODE',
      EXPOSED_DEVICES: 'MATTER_BRIDGE_EXPOSED_DEVICES',
    });
    expect(EXPOSURE_MODES).to.deep.equal({ ALL: 'all', SELECTION: 'selection' });
  });

  it('should use the WindowCovering movement status of the Matter specification', () => {
    expect(MOVEMENT_STATUS).to.deep.equal({ STOPPED: 0, OPENING: 1, CLOSING: 2 });
  });
});
