import {
  canVacuumMap,
  getVacuumRowFeatures,
  getVacuumStateText,
  getVacuumToggleMode,
  isVacuumCleaning
} from '../../../src/components/boxs/device-in-room/device-features/vacuum/vacuumFeatures';
import {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  VACUUM_CLEANER_MODE,
  VACUUM_CLEANER_STATE
} from '../../../../server/utils/constants';

const rowFeatures = (state, runMode) => ({
  state: state === undefined ? undefined : { last_value: state },
  runMode: runMode === undefined ? undefined : { last_value: runMode }
});

describe('Vacuum row: start / stop', () => {
  it('offers stop to a robot that cleans', () => {
    expect(isVacuumCleaning(rowFeatures(VACUUM_CLEANER_STATE.RUNNING, VACUUM_CLEANER_MODE.CLEANING))).to.equal(true);
  });

  it('offers start to a paused robot whose run mode is still cleaning, so it resumes', () => {
    // Matter and the Dreame robots keep the run mode at cleaning during a pause: a stop would
    // write idle and cancel the job.
    expect(isVacuumCleaning(rowFeatures(VACUUM_CLEANER_STATE.PAUSED, VACUUM_CLEANER_MODE.CLEANING))).to.equal(false);
  });

  it('offers start to a paused robot whose run mode is idle', () => {
    expect(isVacuumCleaning(rowFeatures(VACUUM_CLEANER_STATE.PAUSED, VACUUM_CLEANER_MODE.IDLE))).to.equal(false);
  });

  it('keeps stop for a robot going back to its base with the run mode still cleaning', () => {
    expect(
      isVacuumCleaning(rowFeatures(VACUUM_CLEANER_STATE.RETURNING_TO_DOCK, VACUUM_CLEANER_MODE.CLEANING))
    ).to.equal(true);
  });

  it('offers start to a stopped or docked robot', () => {
    expect(isVacuumCleaning(rowFeatures(VACUUM_CLEANER_STATE.STOPPED, VACUUM_CLEANER_MODE.IDLE))).to.equal(false);
    expect(isVacuumCleaning(rowFeatures(VACUUM_CLEANER_STATE.DOCKED, VACUUM_CLEANER_MODE.IDLE))).to.equal(false);
  });

  it('reads the state alone when the widget shows no run mode', () => {
    expect(isVacuumCleaning(rowFeatures(VACUUM_CLEANER_STATE.RUNNING))).to.equal(true);
    expect(isVacuumCleaning(rowFeatures(VACUUM_CLEANER_STATE.PAUSED))).to.equal(false);
  });

  it('reads the run mode alone when the widget shows no state', () => {
    expect(isVacuumCleaning(rowFeatures(undefined, VACUUM_CLEANER_MODE.CLEANING))).to.equal(true);
    expect(isVacuumCleaning(rowFeatures(undefined, VACUUM_CLEANER_MODE.IDLE))).to.equal(false);
  });

  it('offers start when the widget shows neither', () => {
    expect(isVacuumCleaning(rowFeatures())).to.equal(false);
  });

  it('offers stop to a robot running a mapping pass', () => {
    expect(isVacuumCleaning(rowFeatures(VACUUM_CLEANER_STATE.RUNNING, VACUUM_CLEANER_MODE.MAPPING))).to.equal(true);
    expect(isVacuumCleaning(rowFeatures(undefined, VACUUM_CLEANER_MODE.MAPPING))).to.equal(true);
  });
});

describe('Vacuum row: the run mode start / stop writes', () => {
  it('writes idle to stop a robot at work', () => {
    expect(getVacuumToggleMode(rowFeatures(VACUUM_CLEANER_STATE.RUNNING, VACUUM_CLEANER_MODE.CLEANING))).to.equal(
      VACUUM_CLEANER_MODE.IDLE
    );
    expect(getVacuumToggleMode(rowFeatures(VACUUM_CLEANER_STATE.RUNNING, VACUUM_CLEANER_MODE.MAPPING))).to.equal(
      VACUUM_CLEANER_MODE.IDLE
    );
  });

  it('writes cleaning to start an idle robot or resume a paused clean', () => {
    expect(getVacuumToggleMode(rowFeatures(VACUUM_CLEANER_STATE.DOCKED, VACUUM_CLEANER_MODE.IDLE))).to.equal(
      VACUUM_CLEANER_MODE.CLEANING
    );
    expect(getVacuumToggleMode(rowFeatures(VACUUM_CLEANER_STATE.PAUSED, VACUUM_CLEANER_MODE.CLEANING))).to.equal(
      VACUUM_CLEANER_MODE.CLEANING
    );
  });

  it('writes mapping to resume a robot paused during a mapping pass', () => {
    expect(getVacuumToggleMode(rowFeatures(VACUUM_CLEANER_STATE.PAUSED, VACUUM_CLEANER_MODE.MAPPING))).to.equal(
      VACUUM_CLEANER_MODE.MAPPING
    );
  });
});

describe('Vacuum panel: the run mode select', () => {
  it('stays for a run mode that can map', () => {
    expect(canVacuumMap({ last_value: VACUUM_CLEANER_MODE.IDLE })).to.equal(true);
    expect(
      canVacuumMap({
        supported_options: [{ value: VACUUM_CLEANER_MODE.IDLE }, { value: VACUUM_CLEANER_MODE.MAPPING }]
      })
    ).to.equal(true);
  });

  it('is left out for a run mode limited to idle and cleaning, or no run mode', () => {
    expect(
      canVacuumMap({
        supported_options: [{ value: VACUUM_CLEANER_MODE.IDLE }, { value: VACUUM_CLEANER_MODE.CLEANING }]
      })
    ).to.equal(false);
    expect(canVacuumMap(undefined)).to.equal(false);
  });
});

describe('Vacuum row: the state in words', () => {
  const runModeFeature = readOnly => ({
    category: DEVICE_FEATURE_CATEGORIES.VACUUM_CLEANER,
    type: DEVICE_FEATURE_TYPES.VACUUM_CLEANER.RUN_MODE,
    read_only: readOnly,
    last_value: VACUUM_CLEANER_MODE.CLEANING
  });
  const dictionary = {
    deviceFeatureValue: {
      category: {
        [DEVICE_FEATURE_CATEGORIES.VACUUM_CLEANER]: {
          [DEVICE_FEATURE_TYPES.VACUUM_CLEANER.RUN_MODE]: { [VACUUM_CLEANER_MODE.CLEANING]: 'Cleaning' }
        }
      }
    }
  };

  it('reads a read-only run mode when the widget shows no state, without giving it a button', () => {
    const features = getVacuumRowFeatures([runModeFeature(true)]);
    expect(features.runMode).to.equal(undefined);
    expect(getVacuumStateText(dictionary, features)).to.equal('Cleaning');
  });

  it('reads a writable run mode when the widget shows no state', () => {
    const features = getVacuumRowFeatures([runModeFeature(false)]);
    expect(features.runMode).to.not.equal(undefined);
    expect(getVacuumStateText(dictionary, features)).to.equal('Cleaning');
  });
});
