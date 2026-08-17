const { expect } = require('chai');

const {
  MATTER_DISHWASHER_DEVICE_TYPE,
  MATTER_OPERATIONAL_STATE,
  DISHWASHER_ALARMS,
  isDishwasherEndpoint,
  convertMatterOperationalStateToDishwasherState,
  getSupportedDishwasherAlarms,
} = require('../../../../services/matter/utils/dishwasherMatterMapping');

const { DEVICE_FEATURE_TYPES, DISHWASHER_STATE } = require('../../../../utils/constants');

describe('Matter.dishwasherMatterMapping', () => {
  describe('isDishwasherEndpoint', () => {
    it('should detect a dishwasher from a dishwasher-specific cluster', () => {
      expect(isDishwasherEndpoint({}, true)).to.equal(true);
    });

    it('should detect a dishwasher from the Matter device type', () => {
      const device = {
        getDeviceTypes: () => [{ code: MATTER_DISHWASHER_DEVICE_TYPE, name: 'Dishwasher' }],
      };
      expect(isDishwasherEndpoint(device, false)).to.equal(true);
    });

    it('should not detect a dishwasher on another appliance device type', () => {
      const device = {
        getDeviceTypes: () => [{ code: 0x0073, name: 'LaundryWasher' }],
      };
      expect(isDishwasherEndpoint(device, false)).to.equal(false);
    });

    it('should ignore null device types', () => {
      const device = {
        getDeviceTypes: () => [null],
      };
      expect(isDishwasherEndpoint(device, false)).to.equal(false);
    });

    it('should return false when the device types are not a list', () => {
      const device = {
        getDeviceTypes: () => undefined,
      };
      expect(isDishwasherEndpoint(device, false)).to.equal(false);
    });

    it('should return false when the endpoint does not expose device types', () => {
      expect(isDishwasherEndpoint({}, false)).to.equal(false);
    });

    it('should return false when there is no device at all', () => {
      expect(isDishwasherEndpoint(null, false)).to.equal(false);
    });
  });

  describe('convertMatterOperationalStateToDishwasherState', () => {
    it('should convert Matter STOPPED to Gladys STOPPED', () => {
      expect(convertMatterOperationalStateToDishwasherState(MATTER_OPERATIONAL_STATE.STOPPED)).to.equal(
        DISHWASHER_STATE.STOPPED,
      );
    });

    it('should convert Matter RUNNING to Gladys RUNNING', () => {
      expect(convertMatterOperationalStateToDishwasherState(MATTER_OPERATIONAL_STATE.RUNNING)).to.equal(
        DISHWASHER_STATE.RUNNING,
      );
    });

    it('should convert Matter PAUSED to Gladys PAUSED', () => {
      expect(convertMatterOperationalStateToDishwasherState(MATTER_OPERATIONAL_STATE.PAUSED)).to.equal(
        DISHWASHER_STATE.PAUSED,
      );
    });

    it('should convert Matter ERROR to Gladys ERROR', () => {
      expect(convertMatterOperationalStateToDishwasherState(MATTER_OPERATIONAL_STATE.ERROR)).to.equal(
        DISHWASHER_STATE.ERROR,
      );
    });

    it('should return a manufacturer-specific state as-is', () => {
      expect(convertMatterOperationalStateToDishwasherState(0x80)).to.equal(0x80);
    });
  });

  describe('getSupportedDishwasherAlarms', () => {
    it('should expose every alarm when the supported bitmap is missing', () => {
      expect(getSupportedDishwasherAlarms(undefined)).to.deep.equal(DISHWASHER_ALARMS);
    });

    it('should expose every alarm when the supported bitmap is not an object', () => {
      expect(getSupportedDishwasherAlarms(42)).to.deep.equal(DISHWASHER_ALARMS);
    });

    it('should only expose the alarms the appliance supports', () => {
      const alarms = getSupportedDishwasherAlarms({ inflowError: true, doorError: true, drainError: false });
      expect(alarms.map((alarm) => alarm.type)).to.deep.equal([
        DEVICE_FEATURE_TYPES.DISHWASHER.INFLOW_ERROR,
        DEVICE_FEATURE_TYPES.DISHWASHER.DOOR_ERROR,
      ]);
    });

    it('should return an empty list when no alarm is supported', () => {
      expect(getSupportedDishwasherAlarms({})).to.deep.equal([]);
    });
  });

  describe('DISHWASHER_ALARMS', () => {
    it('should cover the six alarms of the Matter Dishwasher Alarm cluster', () => {
      expect(DISHWASHER_ALARMS.map((alarm) => alarm.matterField)).to.deep.equal([
        'inflowError',
        'drainError',
        'doorError',
        'tempTooLow',
        'tempTooHigh',
        'waterLevelError',
      ]);
    });
  });
});
