const { expect } = require('chai');

const { AC_MODE, THERMOSTAT_MODE } = require('../../../../utils/constants');
const {
  MATTER_SYSTEM_MODE,
  matterSystemModeToGladysAcMode,
  gladysAcModeToMatterSystemMode,
  getAcModeSupportedOptions,
  matterSystemModeToGladysThermostatMode,
  gladysThermostatModeToMatterSystemMode,
  getThermostatModeSupportedOptions,
  getSetpointLimits,
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

  it('should build supported options for a heating-only device', () => {
    expect(getAcModeSupportedOptions({ heating: true, autoMode: true })).to.deep.equal([
      { value: AC_MODE.AUTO, label: 'Auto' },
      { value: AC_MODE.HEATING, label: 'Heat' },
    ]);
  });

  it('should return no options when cooling and heating are disabled', () => {
    expect(getAcModeSupportedOptions({})).to.deep.equal([]);
  });

  it('should convert Matter system modes to Gladys thermostat modes, Off included', () => {
    expect(matterSystemModeToGladysThermostatMode(MATTER_SYSTEM_MODE.OFF)).to.eq(THERMOSTAT_MODE.OFF);
    expect(matterSystemModeToGladysThermostatMode(MATTER_SYSTEM_MODE.AUTO)).to.eq(THERMOSTAT_MODE.AUTO);
    expect(matterSystemModeToGladysThermostatMode(MATTER_SYSTEM_MODE.COOL)).to.eq(THERMOSTAT_MODE.COOLING);
    expect(matterSystemModeToGladysThermostatMode(MATTER_SYSTEM_MODE.HEAT)).to.eq(THERMOSTAT_MODE.HEATING);
    expect(matterSystemModeToGladysThermostatMode(MATTER_SYSTEM_MODE.EMERGENCY_HEAT)).to.eq(THERMOSTAT_MODE.HEATING);
    expect(matterSystemModeToGladysThermostatMode(MATTER_SYSTEM_MODE.PRECOOLING)).to.eq(THERMOSTAT_MODE.COOLING);
  });

  it('should return null for Matter system modes without thermostat mode', () => {
    expect(matterSystemModeToGladysThermostatMode(MATTER_SYSTEM_MODE.FAN_ONLY)).to.eq(null);
    expect(matterSystemModeToGladysThermostatMode(MATTER_SYSTEM_MODE.DRY)).to.eq(null);
    expect(matterSystemModeToGladysThermostatMode(MATTER_SYSTEM_MODE.SLEEP)).to.eq(null);
    expect(matterSystemModeToGladysThermostatMode(null)).to.eq(null);
  });

  it('should convert Gladys thermostat modes to Matter system modes', () => {
    expect(gladysThermostatModeToMatterSystemMode(THERMOSTAT_MODE.OFF)).to.eq(MATTER_SYSTEM_MODE.OFF);
    expect(gladysThermostatModeToMatterSystemMode(THERMOSTAT_MODE.HEATING)).to.eq(MATTER_SYSTEM_MODE.HEAT);
    expect(gladysThermostatModeToMatterSystemMode(THERMOSTAT_MODE.COOLING)).to.eq(MATTER_SYSTEM_MODE.COOL);
    expect(gladysThermostatModeToMatterSystemMode(THERMOSTAT_MODE.AUTO)).to.eq(MATTER_SYSTEM_MODE.AUTO);
  });

  it('should throw for an unsupported Gladys thermostat mode', () => {
    expect(() => gladysThermostatModeToMatterSystemMode(99)).to.throw('Unsupported thermostat mode: 99');
  });

  it('should build thermostat mode supported options for a heating-only thermostat', () => {
    expect(getThermostatModeSupportedOptions({ heating: true })).to.deep.equal([
      { value: THERMOSTAT_MODE.OFF, label: 'Off' },
      { value: THERMOSTAT_MODE.HEATING, label: 'Heat' },
    ]);
  });

  it('should build thermostat mode supported options for a full-featured thermostat', () => {
    expect(getThermostatModeSupportedOptions({ heating: true, cooling: true, autoMode: true })).to.deep.equal([
      { value: THERMOSTAT_MODE.OFF, label: 'Off' },
      { value: THERMOSTAT_MODE.HEATING, label: 'Heat' },
      { value: THERMOSTAT_MODE.COOLING, label: 'Cool' },
      { value: THERMOSTAT_MODE.AUTO, label: 'Auto' },
    ]);
  });

  describe('getSetpointLimits', () => {
    it('should read the user setpoint limits first', async () => {
      const thermostat = {
        getMinHeatSetpointLimitAttribute: async () => 500,
        getAbsMinHeatSetpointLimitAttribute: async () => 400,
        getMaxHeatSetpointLimitAttribute: async () => 2500,
        getAbsMaxHeatSetpointLimitAttribute: async () => 3500,
        getMinCoolSetpointLimitAttribute: async () => 1700,
        getMaxCoolSetpointLimitAttribute: async () => 2900,
      };
      expect(await getSetpointLimits(thermostat)).to.deep.equal({
        heating: { min: 5, max: 25 },
        cooling: { min: 17, max: 29 },
      });
    });

    it('should fall back on the absolute limits of the device', async () => {
      const thermostat = {
        getMinHeatSetpointLimitAttribute: async () => undefined,
        getAbsMinHeatSetpointLimitAttribute: async () => 450,
        getMaxHeatSetpointLimitAttribute: async () => null,
        getAbsMaxHeatSetpointLimitAttribute: async () => 3250,
      };
      expect(await getSetpointLimits(thermostat)).to.deep.equal({
        heating: { min: 4.5, max: 32.5 },
        cooling: { min: 16, max: 32 },
      });
    });

    it('should fall back on the defaults of the Matter specification when the limits cannot be read', async () => {
      const thermostat = {
        getMinHeatSetpointLimitAttribute: async () => {
          throw new Error('UnsupportedAttribute');
        },
        getAbsMinHeatSetpointLimitAttribute: async () => 'not a number',
        getMaxHeatSetpointLimitAttribute: async () => NaN,
      };
      expect(await getSetpointLimits(thermostat)).to.deep.equal({
        heating: { min: 7, max: 30 },
        cooling: { min: 16, max: 32 },
      });
    });

    it('should fall back on the defaults when the advertised range is inverted or has no width', async () => {
      const thermostat = {
        getMinHeatSetpointLimitAttribute: async () => 3000,
        getMaxHeatSetpointLimitAttribute: async () => 700,
        getMinCoolSetpointLimitAttribute: async () => 2000,
        getMaxCoolSetpointLimitAttribute: async () => 2000,
      };
      expect(await getSetpointLimits(thermostat)).to.deep.equal({
        heating: { min: 7, max: 30 },
        cooling: { min: 16, max: 32 },
      });
    });
  });
});
