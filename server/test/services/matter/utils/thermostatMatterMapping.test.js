const { expect } = require('chai');

const { AC_MODE } = require('../../../../utils/constants');
const {
  MATTER_SYSTEM_MODE,
  matterSystemModeToGladysAcMode,
  gladysAcModeToMatterSystemMode,
  getAcModeSupportedOptions,
} = require('../../../../services/matter/utils/thermostatMatterMapping');

describe('Matter thermostatMatterMapping', () => {
  it('should convert Matter system modes to Gladys AC modes', () => {
    expect(matterSystemModeToGladysAcMode(MATTER_SYSTEM_MODE.AUTO)).to.eq(AC_MODE.AUTO);
    expect(matterSystemModeToGladysAcMode(MATTER_SYSTEM_MODE.COOL)).to.eq(AC_MODE.COOLING);
    expect(matterSystemModeToGladysAcMode(MATTER_SYSTEM_MODE.HEAT)).to.eq(AC_MODE.HEATING);
    expect(matterSystemModeToGladysAcMode(MATTER_SYSTEM_MODE.EMERGENCY_HEAT)).to.eq(AC_MODE.HEATING);
    expect(matterSystemModeToGladysAcMode(MATTER_SYSTEM_MODE.PRECOOLING)).to.eq(AC_MODE.COOLING);
    expect(matterSystemModeToGladysAcMode(MATTER_SYSTEM_MODE.FAN_ONLY)).to.eq(AC_MODE.FAN);
    expect(matterSystemModeToGladysAcMode(MATTER_SYSTEM_MODE.DRY)).to.eq(AC_MODE.DRYING);
    expect(matterSystemModeToGladysAcMode(MATTER_SYSTEM_MODE.SLEEP)).to.eq(AC_MODE.AUTO);
  });

  it('should return null for Matter system modes without Gladys equivalent', () => {
    expect(matterSystemModeToGladysAcMode(MATTER_SYSTEM_MODE.OFF)).to.eq(null);
    expect(matterSystemModeToGladysAcMode(99)).to.eq(null);
  });

  it('should convert Gladys AC modes to Matter system modes', () => {
    expect(gladysAcModeToMatterSystemMode(AC_MODE.AUTO)).to.eq(MATTER_SYSTEM_MODE.AUTO);
    expect(gladysAcModeToMatterSystemMode(AC_MODE.COOLING)).to.eq(MATTER_SYSTEM_MODE.COOL);
    expect(gladysAcModeToMatterSystemMode(AC_MODE.HEATING)).to.eq(MATTER_SYSTEM_MODE.HEAT);
    expect(gladysAcModeToMatterSystemMode(AC_MODE.DRYING)).to.eq(MATTER_SYSTEM_MODE.DRY);
    expect(gladysAcModeToMatterSystemMode(AC_MODE.FAN)).to.eq(MATTER_SYSTEM_MODE.FAN_ONLY);
  });

  it('should throw for an unsupported Gladys AC mode', () => {
    expect(() => gladysAcModeToMatterSystemMode(99)).to.throw('Unsupported air conditioning mode: 99');
  });

  it('should build supported options for a full-featured air conditioner', () => {
    expect(getAcModeSupportedOptions({ heating: true, cooling: true, autoMode: true })).to.deep.equal([
      { value: AC_MODE.AUTO, label: 'Auto' },
      { value: AC_MODE.COOLING, label: 'Cool' },
      { value: AC_MODE.HEATING, label: 'Heat' },
      { value: AC_MODE.DRYING, label: 'Dry' },
      { value: AC_MODE.FAN, label: 'Fan' },
    ]);
  });

  it('should build supported options for a cooling-only device', () => {
    expect(getAcModeSupportedOptions({ cooling: true })).to.deep.equal([
      { value: AC_MODE.COOLING, label: 'Cool' },
      { value: AC_MODE.DRYING, label: 'Dry' },
      { value: AC_MODE.FAN, label: 'Fan' },
    ]);
  });

  it('should build supported options without auto mode', () => {
    expect(getAcModeSupportedOptions({ heating: true, cooling: true })).to.deep.equal([
      { value: AC_MODE.COOLING, label: 'Cool' },
      { value: AC_MODE.HEATING, label: 'Heat' },
      { value: AC_MODE.DRYING, label: 'Dry' },
      { value: AC_MODE.FAN, label: 'Fan' },
    ]);
  });
});
