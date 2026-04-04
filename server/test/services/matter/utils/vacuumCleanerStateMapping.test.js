const { expect } = require('chai');

const {
  MATTER_RVC_OPERATIONAL_STATE,
  MATTER_RVC_RUN_MODE,
  convertMatterOperationalStateToGladys,
  convertGladysOperationalStateToMatter,
  convertMatterRunModeToGladys,
  convertGladysRunModeToMatter,
} = require('../../../../services/matter/utils/vacuumCleanerStateMapping');

const { VACUUM_CLEANER_STATE, VACUUM_CLEANER_MODE } = require('../../../../utils/constants');

describe('Matter.vacuumCleanerStateMapping', () => {
  describe('convertMatterOperationalStateToGladys', () => {
    it('should convert Matter STOPPED to Gladys STOPPED', () => {
      expect(convertMatterOperationalStateToGladys(MATTER_RVC_OPERATIONAL_STATE.STOPPED)).to.equal(VACUUM_CLEANER_STATE.STOPPED);
    });

    it('should convert Matter RUNNING to Gladys RUNNING', () => {
      expect(convertMatterOperationalStateToGladys(MATTER_RVC_OPERATIONAL_STATE.RUNNING)).to.equal(VACUUM_CLEANER_STATE.RUNNING);
    });

    it('should convert Matter PAUSED to Gladys PAUSED', () => {
      expect(convertMatterOperationalStateToGladys(MATTER_RVC_OPERATIONAL_STATE.PAUSED)).to.equal(VACUUM_CLEANER_STATE.PAUSED);
    });

    it('should convert Matter ERROR to Gladys ERROR', () => {
      expect(convertMatterOperationalStateToGladys(MATTER_RVC_OPERATIONAL_STATE.ERROR)).to.equal(VACUUM_CLEANER_STATE.ERROR);
    });

    it('should convert Matter SEEKING_CHARGER (64) to Gladys RETURNING_TO_DOCK (4)', () => {
      expect(convertMatterOperationalStateToGladys(MATTER_RVC_OPERATIONAL_STATE.SEEKING_CHARGER)).to.equal(VACUUM_CLEANER_STATE.RETURNING_TO_DOCK);
    });

    it('should convert Matter CHARGING (65) to Gladys CHARGING (5)', () => {
      expect(convertMatterOperationalStateToGladys(MATTER_RVC_OPERATIONAL_STATE.CHARGING)).to.equal(VACUUM_CLEANER_STATE.CHARGING);
    });

    it('should convert Matter DOCKED (66) to Gladys DOCKED (6)', () => {
      expect(convertMatterOperationalStateToGladys(MATTER_RVC_OPERATIONAL_STATE.DOCKED)).to.equal(VACUUM_CLEANER_STATE.DOCKED);
    });

    it('should return unknown values as-is', () => {
      expect(convertMatterOperationalStateToGladys(99)).to.equal(99);
    });
  });

  describe('convertGladysOperationalStateToMatter', () => {
    it('should convert Gladys STOPPED to Matter STOPPED', () => {
      expect(convertGladysOperationalStateToMatter(VACUUM_CLEANER_STATE.STOPPED)).to.equal(MATTER_RVC_OPERATIONAL_STATE.STOPPED);
    });

    it('should convert Gladys RETURNING_TO_DOCK (4) to Matter SEEKING_CHARGER (64)', () => {
      expect(convertGladysOperationalStateToMatter(VACUUM_CLEANER_STATE.RETURNING_TO_DOCK)).to.equal(MATTER_RVC_OPERATIONAL_STATE.SEEKING_CHARGER);
    });

    it('should convert Gladys DOCKED (6) to Matter DOCKED (66)', () => {
      expect(convertGladysOperationalStateToMatter(VACUUM_CLEANER_STATE.DOCKED)).to.equal(MATTER_RVC_OPERATIONAL_STATE.DOCKED);
    });

    it('should return unknown values as-is', () => {
      expect(convertGladysOperationalStateToMatter(99)).to.equal(99);
    });
  });

  describe('convertMatterRunModeToGladys', () => {
    it('should convert Matter IDLE to Gladys IDLE', () => {
      expect(convertMatterRunModeToGladys(MATTER_RVC_RUN_MODE.IDLE)).to.equal(VACUUM_CLEANER_MODE.IDLE);
    });

    it('should convert Matter CLEANING to Gladys CLEANING', () => {
      expect(convertMatterRunModeToGladys(MATTER_RVC_RUN_MODE.CLEANING)).to.equal(VACUUM_CLEANER_MODE.CLEANING);
    });

    it('should convert Matter MAPPING to Gladys MAPPING', () => {
      expect(convertMatterRunModeToGladys(MATTER_RVC_RUN_MODE.MAPPING)).to.equal(VACUUM_CLEANER_MODE.MAPPING);
    });

    it('should return unknown values as-is', () => {
      expect(convertMatterRunModeToGladys(99)).to.equal(99);
    });
  });

  describe('convertGladysRunModeToMatter', () => {
    it('should convert Gladys IDLE to Matter IDLE', () => {
      expect(convertGladysRunModeToMatter(VACUUM_CLEANER_MODE.IDLE)).to.equal(MATTER_RVC_RUN_MODE.IDLE);
    });

    it('should convert Gladys CLEANING to Matter CLEANING', () => {
      expect(convertGladysRunModeToMatter(VACUUM_CLEANER_MODE.CLEANING)).to.equal(MATTER_RVC_RUN_MODE.CLEANING);
    });

    it('should convert Gladys MAPPING to Matter MAPPING', () => {
      expect(convertGladysRunModeToMatter(VACUUM_CLEANER_MODE.MAPPING)).to.equal(MATTER_RVC_RUN_MODE.MAPPING);
    });

    it('should return unknown values as-is', () => {
      expect(convertGladysRunModeToMatter(99)).to.equal(99);
    });
  });
});
