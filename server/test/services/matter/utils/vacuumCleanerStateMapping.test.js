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

  describe('dynamic supportedModes mapping', () => {
    // Simulates Matterbridge Roborock plugin supportedModes where Idle=1, Cleaning=2
    const roborockRunModeSupportedModes = {
      supportedModes: [
        { mode: 1, label: 'Idle', modeTags: [{ value: 16384 }] }, // ModeTag 16384 = Idle
        { mode: 2, label: 'Cleaning', modeTags: [{ value: 16385 }] }, // ModeTag 16385 = Cleaning
      ],
      clusterType: 'RvcRunMode',
    };

    const roborockCleanModeSupportedModes = {
      supportedModes: [{ mode: 1, label: 'Vacuum', modeTags: [{ value: 16385 }] }], // ModeTag 16385 = Vacuum
      clusterType: 'RvcCleanMode',
    };

    describe('convertMatterRunModeToGladys with supportedModes', () => {
      it('should convert Matter mode 1 to Gladys IDLE using supportedModes', () => {
        expect(convertMatterRunModeToGladys(1, roborockRunModeSupportedModes)).to.equal(VACUUM_CLEANER_MODE.IDLE);
      });

      it('should convert Matter mode 2 to Gladys CLEANING using supportedModes', () => {
        expect(convertMatterRunModeToGladys(2, roborockRunModeSupportedModes)).to.equal(VACUUM_CLEANER_MODE.CLEANING);
      });

      it('should fallback to static mapping when supportedModes is null', () => {
        expect(convertMatterRunModeToGladys(0, null)).to.equal(VACUUM_CLEANER_MODE.IDLE);
      });
    });

    describe('convertGladysRunModeToMatter with supportedModes', () => {
      it('should convert Gladys IDLE to Matter mode 1 using supportedModes', () => {
        expect(convertGladysRunModeToMatter(VACUUM_CLEANER_MODE.IDLE, roborockRunModeSupportedModes)).to.equal(1);
      });

      it('should convert Gladys CLEANING to Matter mode 2 using supportedModes', () => {
        expect(convertGladysRunModeToMatter(VACUUM_CLEANER_MODE.CLEANING, roborockRunModeSupportedModes)).to.equal(2);
      });

      it('should fallback to static mapping when supportedModes is null', () => {
        expect(convertGladysRunModeToMatter(VACUUM_CLEANER_MODE.IDLE, null)).to.equal(MATTER_RVC_RUN_MODE.IDLE);
      });
    });

    describe('convertMatterCleanModeToGladys with supportedModes', () => {
      it('should convert Matter mode 1 to Gladys VACUUM using supportedModes', () => {
        expect(convertMatterCleanModeToGladys(1, roborockCleanModeSupportedModes)).to.equal(
          VACUUM_CLEANER_CLEAN_MODE.VACUUM,
        );
      });

      it('should fallback to static mapping when supportedModes is null', () => {
        expect(convertMatterCleanModeToGladys(0, null)).to.equal(VACUUM_CLEANER_CLEAN_MODE.AUTO);
      });
    });

    describe('convertGladysCleanModeToMatter with supportedModes', () => {
      it('should convert Gladys VACUUM to Matter mode 1 using supportedModes', () => {
        expect(
          convertGladysCleanModeToMatter(VACUUM_CLEANER_CLEAN_MODE.VACUUM, roborockCleanModeSupportedModes),
        ).to.equal(1);
      });

      it('should fallback to static mapping when supportedModes is null', () => {
        expect(convertGladysCleanModeToMatter(VACUUM_CLEANER_CLEAN_MODE.AUTO, null)).to.equal(
          MATTER_RVC_CLEAN_MODE.AUTO,
        );
      });
    });

    describe('fallback when mode not found in supportedModes', () => {
      // supportedModes that doesn't contain all modes
      const incompleteSupportedModes = {
        supportedModes: [{ mode: 1, label: 'Idle', modeTags: [{ value: 16384 }] }],
        clusterType: 'RvcRunMode',
      };

      const incompleteCleanModeSupportedModes = {
        supportedModes: [{ mode: 1, label: 'Vacuum', modeTags: [{ value: 16385 }] }],
        clusterType: 'RvcCleanMode',
      };

      it('should fallback when Matter mode not found in supportedModes (RvcRunMode)', () => {
        // Mode 99 is not in supportedModes, should fallback to static mapping
        expect(convertMatterRunModeToGladys(99, incompleteSupportedModes)).to.equal(99);
      });

      it('should fallback when Gladys mode not found in supportedModes (RvcRunMode)', () => {
        // MAPPING mode tag is not in supportedModes, should fallback to static mapping
        expect(convertGladysRunModeToMatter(VACUUM_CLEANER_MODE.MAPPING, incompleteSupportedModes)).to.equal(
          MATTER_RVC_RUN_MODE.MAPPING,
        );
      });

      it('should fallback when Matter mode not found in supportedModes (RvcCleanMode)', () => {
        // Mode 99 is not in supportedModes, should fallback to static mapping
        expect(convertMatterCleanModeToGladys(99, incompleteCleanModeSupportedModes)).to.equal(99);
      });

      it('should fallback when Gladys mode not found in supportedModes (RvcCleanMode)', () => {
        // MOP mode tag is not in supportedModes, should fallback to static mapping
        expect(
          convertGladysCleanModeToMatter(VACUUM_CLEANER_CLEAN_MODE.MOP, incompleteCleanModeSupportedModes),
        ).to.equal(MATTER_RVC_CLEAN_MODE.MOP);
      });
    });

    describe('edge cases with invalid supportedModes data', () => {
      it('should fallback when supportedModes is not an array (RvcRunMode)', () => {
        const invalidData = { supportedModes: 'not-an-array', clusterType: 'RvcRunMode' };
        expect(convertMatterRunModeToGladys(0, invalidData)).to.equal(VACUUM_CLEANER_MODE.IDLE);
      });

      it('should fallback when supportedModes is not an array (RvcCleanMode)', () => {
        const invalidData = { supportedModes: 'not-an-array', clusterType: 'RvcCleanMode' };
        expect(convertMatterCleanModeToGladys(0, invalidData)).to.equal(VACUUM_CLEANER_CLEAN_MODE.AUTO);
      });

      it('should fallback when supportedModes is not an array for Gladys to Matter (RvcRunMode)', () => {
        const invalidData = { supportedModes: 'not-an-array', clusterType: 'RvcRunMode' };
        expect(convertGladysRunModeToMatter(VACUUM_CLEANER_MODE.IDLE, invalidData)).to.equal(MATTER_RVC_RUN_MODE.IDLE);
      });

      it('should fallback when supportedModes is not an array for Gladys to Matter (RvcCleanMode)', () => {
        const invalidData = { supportedModes: 'not-an-array', clusterType: 'RvcCleanMode' };
        expect(convertGladysCleanModeToMatter(VACUUM_CLEANER_CLEAN_MODE.AUTO, invalidData)).to.equal(
          MATTER_RVC_CLEAN_MODE.AUTO,
        );
      });

      it('should ignore modes with missing modeTags during scoring (Gladys to Matter)', () => {
        // One mode has no modeTags array, scoreModeMatch should return 0 for it
        const data = {
          clusterType: 'RvcCleanMode',
          supportedModes: [
            { mode: 1, label: 'Broken' }, // missing modeTags
            { mode: 2, label: 'Vacuum', modeTags: [{ value: 16385 }] },
          ],
        };
        expect(convertGladysCleanModeToMatter(VACUUM_CLEANER_CLEAN_MODE.VACUUM, data)).to.equal(2);
      });

      it('should return null and fallback when no preference exists for the Gladys mode', () => {
        // Gladys mode 99 has no entry in GLADYS_CLEAN_MODE_PREFERENCES
        const data = {
          clusterType: 'RvcCleanMode',
          supportedModes: [{ mode: 1, label: 'Vacuum', modeTags: [{ value: 16385 }] }],
        };
        // Should fallback to static mapping which returns 99 as-is
        expect(convertGladysCleanModeToMatter(99, data)).to.equal(99);
      });
    });

    describe('real-world Roborock RvcCleanMode mapping', () => {
      // Real supportedModes returned by Matterbridge Roborock plugin
      const roborockRealSupportedModes = {
        clusterType: 'RvcCleanMode',
        supportedModes: [
          { label: 'Vacuum & Mop: Default', mode: 5, modeTags: [{ value: 16386 }, { value: 16385 }, { value: 0 }] },
          { label: 'Vacuum & Mop: Quick', mode: 6, modeTags: [{ value: 16386 }, { value: 16385 }, { value: 1 }] },
          { label: 'Vacuum & Mop: Max', mode: 7, modeTags: [{ value: 16386 }, { value: 16385 }, { value: 7 }] },
          { label: 'Vacuum & Mop: Min', mode: 8, modeTags: [{ value: 16386 }, { value: 16385 }, { value: 6 }] },
          { label: 'Vacuum & Mop: Quiet', mode: 9, modeTags: [{ value: 16386 }, { value: 16385 }, { value: 2 }] },
          {
            label: 'Vacuum & Mop: Energy Saving',
            mode: 10,
            modeTags: [{ value: 16386 }, { value: 16385 }, { value: 4 }],
          },
          { label: 'Mop: Default', mode: 31, modeTags: [{ value: 16386 }, { value: 0 }] },
          { label: 'Mop: Max', mode: 32, modeTags: [{ value: 16386 }, { value: 7 }] },
          { label: 'Mop: Min', mode: 33, modeTags: [{ value: 16386 }, { value: 6 }] },
          { label: 'Mop: Quick', mode: 34, modeTags: [{ value: 16386 }, { value: 1 }] },
          { label: 'Mop: Deep', mode: 35, modeTags: [{ value: 16386 }, { value: 16384 }] },
          { label: 'Vacuum: Default', mode: 66, modeTags: [{ value: 16385 }, { value: 0 }] },
          { label: 'Vacuum: Max', mode: 67, modeTags: [{ value: 16385 }, { value: 7 }] },
          { label: 'Vacuum: Quiet', mode: 68, modeTags: [{ value: 16385 }, { value: 2 }] },
          { label: 'Vacuum: Quick', mode: 69, modeTags: [{ value: 16385 }, { value: 1 }] },
        ],
      };

      describe('Gladys → Matter (setValue)', () => {
        it('should map Gladys VACUUM to mode 66 (Vacuum: Default)', () => {
          expect(convertGladysCleanModeToMatter(VACUUM_CLEANER_CLEAN_MODE.VACUUM, roborockRealSupportedModes)).to.equal(
            66,
          );
        });

        it('should map Gladys MOP to mode 31 (Mop: Default)', () => {
          expect(convertGladysCleanModeToMatter(VACUUM_CLEANER_CLEAN_MODE.MOP, roborockRealSupportedModes)).to.equal(
            31,
          );
        });

        it('should map Gladys DEEP_CLEAN to mode 35 (Mop: Deep)', () => {
          expect(
            convertGladysCleanModeToMatter(VACUUM_CLEANER_CLEAN_MODE.DEEP_CLEAN, roborockRealSupportedModes),
          ).to.equal(35);
        });

        it('should map Gladys AUTO to mode 5 (Vacuum & Mop: Default)', () => {
          expect(convertGladysCleanModeToMatter(VACUUM_CLEANER_CLEAN_MODE.AUTO, roborockRealSupportedModes)).to.equal(
            5,
          );
        });

        it('should map Gladys QUICK to mode 6 (Vacuum & Mop: Quick)', () => {
          expect(convertGladysCleanModeToMatter(VACUUM_CLEANER_CLEAN_MODE.QUICK, roborockRealSupportedModes)).to.equal(
            6,
          );
        });

        it('should map Gladys QUIET to mode 9 (Vacuum & Mop: Quiet)', () => {
          expect(convertGladysCleanModeToMatter(VACUUM_CLEANER_CLEAN_MODE.QUIET, roborockRealSupportedModes)).to.equal(
            9,
          );
        });

        it('should map Gladys LOW_NOISE to mode 10 (Vacuum & Mop: Energy Saving)', () => {
          expect(
            convertGladysCleanModeToMatter(VACUUM_CLEANER_CLEAN_MODE.LOW_NOISE, roborockRealSupportedModes),
          ).to.equal(10);
        });
      });

      describe('Matter → Gladys (state change)', () => {
        it('should map mode 5 (Vacuum & Mop: Default) to Gladys AUTO (intensity wins for dual-purpose mode)', () => {
          expect(convertMatterCleanModeToGladys(5, roborockRealSupportedModes)).to.equal(
            VACUUM_CLEANER_CLEAN_MODE.AUTO,
          );
        });

        it('should map mode 6 (Vacuum & Mop: Quick) to Gladys QUICK', () => {
          expect(convertMatterCleanModeToGladys(6, roborockRealSupportedModes)).to.equal(
            VACUUM_CLEANER_CLEAN_MODE.QUICK,
          );
        });

        it('should map mode 9 (Vacuum & Mop: Quiet) to Gladys QUIET', () => {
          expect(convertMatterCleanModeToGladys(9, roborockRealSupportedModes)).to.equal(
            VACUUM_CLEANER_CLEAN_MODE.QUIET,
          );
        });

        it('should map mode 10 (Vacuum & Mop: Energy Saving) to Gladys LOW_NOISE', () => {
          expect(convertMatterCleanModeToGladys(10, roborockRealSupportedModes)).to.equal(
            VACUUM_CLEANER_CLEAN_MODE.LOW_NOISE,
          );
        });

        it('should map mode 31 (Mop: Default) to Gladys MOP (type wins over intensity)', () => {
          expect(convertMatterCleanModeToGladys(31, roborockRealSupportedModes)).to.equal(
            VACUUM_CLEANER_CLEAN_MODE.MOP,
          );
        });

        it('should map mode 35 (Mop: Deep) to Gladys DEEP_CLEAN (most specific tag wins)', () => {
          expect(convertMatterCleanModeToGladys(35, roborockRealSupportedModes)).to.equal(
            VACUUM_CLEANER_CLEAN_MODE.DEEP_CLEAN,
          );
        });

        it('should map mode 66 (Vacuum: Default) to Gladys VACUUM (type wins over intensity)', () => {
          expect(convertMatterCleanModeToGladys(66, roborockRealSupportedModes)).to.equal(
            VACUUM_CLEANER_CLEAN_MODE.VACUUM,
          );
        });

        it('should map mode 68 (Vacuum: Quiet) to Gladys VACUUM (type wins)', () => {
          expect(convertMatterCleanModeToGladys(68, roborockRealSupportedModes)).to.equal(
            VACUUM_CLEANER_CLEAN_MODE.VACUUM,
          );
        });
      });

      describe('roundtrip Gladys → Matter → Gladys', () => {
        it('should preserve VACUUM through roundtrip', () => {
          const matter = convertGladysCleanModeToMatter(VACUUM_CLEANER_CLEAN_MODE.VACUUM, roborockRealSupportedModes);
          expect(convertMatterCleanModeToGladys(matter, roborockRealSupportedModes)).to.equal(
            VACUUM_CLEANER_CLEAN_MODE.VACUUM,
          );
        });

        it('should preserve MOP through roundtrip', () => {
          const matter = convertGladysCleanModeToMatter(VACUUM_CLEANER_CLEAN_MODE.MOP, roborockRealSupportedModes);
          expect(convertMatterCleanModeToGladys(matter, roborockRealSupportedModes)).to.equal(
            VACUUM_CLEANER_CLEAN_MODE.MOP,
          );
        });

        it('should preserve DEEP_CLEAN through roundtrip', () => {
          const matter = convertGladysCleanModeToMatter(
            VACUUM_CLEANER_CLEAN_MODE.DEEP_CLEAN,
            roborockRealSupportedModes,
          );
          expect(convertMatterCleanModeToGladys(matter, roborockRealSupportedModes)).to.equal(
            VACUUM_CLEANER_CLEAN_MODE.DEEP_CLEAN,
          );
        });

        it('should preserve AUTO through roundtrip', () => {
          const matter = convertGladysCleanModeToMatter(VACUUM_CLEANER_CLEAN_MODE.AUTO, roborockRealSupportedModes);
          expect(convertMatterCleanModeToGladys(matter, roborockRealSupportedModes)).to.equal(
            VACUUM_CLEANER_CLEAN_MODE.AUTO,
          );
        });

        it('should preserve QUICK through roundtrip', () => {
          const matter = convertGladysCleanModeToMatter(VACUUM_CLEANER_CLEAN_MODE.QUICK, roborockRealSupportedModes);
          expect(convertMatterCleanModeToGladys(matter, roborockRealSupportedModes)).to.equal(
            VACUUM_CLEANER_CLEAN_MODE.QUICK,
          );
        });

        it('should preserve QUIET through roundtrip', () => {
          const matter = convertGladysCleanModeToMatter(VACUUM_CLEANER_CLEAN_MODE.QUIET, roborockRealSupportedModes);
          expect(convertMatterCleanModeToGladys(matter, roborockRealSupportedModes)).to.equal(
            VACUUM_CLEANER_CLEAN_MODE.QUIET,
          );
        });

        it('should preserve LOW_NOISE through roundtrip', () => {
          const matter = convertGladysCleanModeToMatter(
            VACUUM_CLEANER_CLEAN_MODE.LOW_NOISE,
            roborockRealSupportedModes,
          );
          expect(convertMatterCleanModeToGladys(matter, roborockRealSupportedModes)).to.equal(
            VACUUM_CLEANER_CLEAN_MODE.LOW_NOISE,
          );
        });
      });
    });
  });
});
