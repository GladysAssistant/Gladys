const { expect } = require('chai');

const {
  MATTER_RVC_OPERATIONAL_STATE,
  MATTER_RVC_RUN_MODE,
  MATTER_RVC_CLEAN_MODE,
  convertMatterOperationalStateToGladys,
  convertGladysOperationalStateToMatter,
  convertMatterRunModeToGladys,
  convertGladysRunModeToMatter,
  convertMatterCleanModeToGladys,
  convertGladysCleanModeToMatter,
} = require('../../../../services/matter/utils/vacuumCleanerStateMapping');

const { VACUUM_CLEANER_STATE, VACUUM_CLEANER_MODE, VACUUM_CLEANER_CLEAN_MODE } = require('../../../../utils/constants');

describe('Matter.vacuumCleanerStateMapping', () => {
  describe('convertMatterOperationalStateToGladys', () => {
    it('should convert Matter STOPPED to Gladys STOPPED', () => {
      expect(convertMatterOperationalStateToGladys(MATTER_RVC_OPERATIONAL_STATE.STOPPED)).to.equal(
        VACUUM_CLEANER_STATE.STOPPED,
      );
    });

    it('should convert Matter RUNNING to Gladys RUNNING', () => {
      expect(convertMatterOperationalStateToGladys(MATTER_RVC_OPERATIONAL_STATE.RUNNING)).to.equal(
        VACUUM_CLEANER_STATE.RUNNING,
      );
    });

    it('should convert Matter PAUSED to Gladys PAUSED', () => {
      expect(convertMatterOperationalStateToGladys(MATTER_RVC_OPERATIONAL_STATE.PAUSED)).to.equal(
        VACUUM_CLEANER_STATE.PAUSED,
      );
    });

    it('should convert Matter ERROR to Gladys ERROR', () => {
      expect(convertMatterOperationalStateToGladys(MATTER_RVC_OPERATIONAL_STATE.ERROR)).to.equal(
        VACUUM_CLEANER_STATE.ERROR,
      );
    });

    it('should convert Matter SEEKING_CHARGER (64) to Gladys RETURNING_TO_DOCK (4)', () => {
      expect(convertMatterOperationalStateToGladys(MATTER_RVC_OPERATIONAL_STATE.SEEKING_CHARGER)).to.equal(
        VACUUM_CLEANER_STATE.RETURNING_TO_DOCK,
      );
    });

    it('should convert Matter CHARGING (65) to Gladys CHARGING (5)', () => {
      expect(convertMatterOperationalStateToGladys(MATTER_RVC_OPERATIONAL_STATE.CHARGING)).to.equal(
        VACUUM_CLEANER_STATE.CHARGING,
      );
    });

    it('should convert Matter DOCKED (66) to Gladys DOCKED (6)', () => {
      expect(convertMatterOperationalStateToGladys(MATTER_RVC_OPERATIONAL_STATE.DOCKED)).to.equal(
        VACUUM_CLEANER_STATE.DOCKED,
      );
    });

    it('should return unknown values as-is', () => {
      expect(convertMatterOperationalStateToGladys(99)).to.equal(99);
    });
  });

  describe('convertGladysOperationalStateToMatter', () => {
    it('should convert Gladys STOPPED to Matter STOPPED', () => {
      expect(convertGladysOperationalStateToMatter(VACUUM_CLEANER_STATE.STOPPED)).to.equal(
        MATTER_RVC_OPERATIONAL_STATE.STOPPED,
      );
    });

    it('should convert Gladys RUNNING to Matter RUNNING', () => {
      expect(convertGladysOperationalStateToMatter(VACUUM_CLEANER_STATE.RUNNING)).to.equal(
        MATTER_RVC_OPERATIONAL_STATE.RUNNING,
      );
    });

    it('should convert Gladys PAUSED to Matter PAUSED', () => {
      expect(convertGladysOperationalStateToMatter(VACUUM_CLEANER_STATE.PAUSED)).to.equal(
        MATTER_RVC_OPERATIONAL_STATE.PAUSED,
      );
    });

    it('should convert Gladys ERROR to Matter ERROR', () => {
      expect(convertGladysOperationalStateToMatter(VACUUM_CLEANER_STATE.ERROR)).to.equal(
        MATTER_RVC_OPERATIONAL_STATE.ERROR,
      );
    });

    it('should convert Gladys RETURNING_TO_DOCK (4) to Matter SEEKING_CHARGER (64)', () => {
      expect(convertGladysOperationalStateToMatter(VACUUM_CLEANER_STATE.RETURNING_TO_DOCK)).to.equal(
        MATTER_RVC_OPERATIONAL_STATE.SEEKING_CHARGER,
      );
    });

    it('should convert Gladys CHARGING (5) to Matter CHARGING (65)', () => {
      expect(convertGladysOperationalStateToMatter(VACUUM_CLEANER_STATE.CHARGING)).to.equal(
        MATTER_RVC_OPERATIONAL_STATE.CHARGING,
      );
    });

    it('should convert Gladys DOCKED (6) to Matter DOCKED (66)', () => {
      expect(convertGladysOperationalStateToMatter(VACUUM_CLEANER_STATE.DOCKED)).to.equal(
        MATTER_RVC_OPERATIONAL_STATE.DOCKED,
      );
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

  describe('convertMatterCleanModeToGladys', () => {
    it('should convert Matter AUTO to Gladys AUTO', () => {
      expect(convertMatterCleanModeToGladys(MATTER_RVC_CLEAN_MODE.AUTO)).to.equal(VACUUM_CLEANER_CLEAN_MODE.AUTO);
    });

    it('should convert Matter QUICK to Gladys QUICK', () => {
      expect(convertMatterCleanModeToGladys(MATTER_RVC_CLEAN_MODE.QUICK)).to.equal(VACUUM_CLEANER_CLEAN_MODE.QUICK);
    });

    it('should convert Matter QUIET to Gladys QUIET', () => {
      expect(convertMatterCleanModeToGladys(MATTER_RVC_CLEAN_MODE.QUIET)).to.equal(VACUUM_CLEANER_CLEAN_MODE.QUIET);
    });

    it('should convert Matter LOW_NOISE to Gladys LOW_NOISE', () => {
      expect(convertMatterCleanModeToGladys(MATTER_RVC_CLEAN_MODE.LOW_NOISE)).to.equal(
        VACUUM_CLEANER_CLEAN_MODE.LOW_NOISE,
      );
    });

    it('should convert Matter DEEP_CLEAN (16384) to Gladys DEEP_CLEAN (4)', () => {
      expect(convertMatterCleanModeToGladys(MATTER_RVC_CLEAN_MODE.DEEP_CLEAN)).to.equal(
        VACUUM_CLEANER_CLEAN_MODE.DEEP_CLEAN,
      );
    });

    it('should convert Matter VACUUM (16385) to Gladys VACUUM (5)', () => {
      expect(convertMatterCleanModeToGladys(MATTER_RVC_CLEAN_MODE.VACUUM)).to.equal(VACUUM_CLEANER_CLEAN_MODE.VACUUM);
    });

    it('should convert Matter MOP (16386) to Gladys MOP (6)', () => {
      expect(convertMatterCleanModeToGladys(MATTER_RVC_CLEAN_MODE.MOP)).to.equal(VACUUM_CLEANER_CLEAN_MODE.MOP);
    });

    it('should return unknown values as-is', () => {
      expect(convertMatterCleanModeToGladys(99)).to.equal(99);
    });
  });

  describe('convertGladysCleanModeToMatter', () => {
    it('should convert Gladys AUTO to Matter AUTO', () => {
      expect(convertGladysCleanModeToMatter(VACUUM_CLEANER_CLEAN_MODE.AUTO)).to.equal(MATTER_RVC_CLEAN_MODE.AUTO);
    });

    it('should convert Gladys QUICK to Matter QUICK', () => {
      expect(convertGladysCleanModeToMatter(VACUUM_CLEANER_CLEAN_MODE.QUICK)).to.equal(MATTER_RVC_CLEAN_MODE.QUICK);
    });

    it('should convert Gladys QUIET to Matter QUIET', () => {
      expect(convertGladysCleanModeToMatter(VACUUM_CLEANER_CLEAN_MODE.QUIET)).to.equal(MATTER_RVC_CLEAN_MODE.QUIET);
    });

    it('should convert Gladys LOW_NOISE to Matter LOW_NOISE', () => {
      expect(convertGladysCleanModeToMatter(VACUUM_CLEANER_CLEAN_MODE.LOW_NOISE)).to.equal(
        MATTER_RVC_CLEAN_MODE.LOW_NOISE,
      );
    });

    it('should convert Gladys DEEP_CLEAN (4) to Matter DEEP_CLEAN (16384)', () => {
      expect(convertGladysCleanModeToMatter(VACUUM_CLEANER_CLEAN_MODE.DEEP_CLEAN)).to.equal(
        MATTER_RVC_CLEAN_MODE.DEEP_CLEAN,
      );
    });

    it('should convert Gladys VACUUM (5) to Matter VACUUM (16385)', () => {
      expect(convertGladysCleanModeToMatter(VACUUM_CLEANER_CLEAN_MODE.VACUUM)).to.equal(MATTER_RVC_CLEAN_MODE.VACUUM);
    });

    it('should convert Gladys MOP (6) to Matter MOP (16386)', () => {
      expect(convertGladysCleanModeToMatter(VACUUM_CLEANER_CLEAN_MODE.MOP)).to.equal(MATTER_RVC_CLEAN_MODE.MOP);
    });

    it('should return unknown values as-is', () => {
      expect(convertGladysCleanModeToMatter(99)).to.equal(99);
    });
  });
});
