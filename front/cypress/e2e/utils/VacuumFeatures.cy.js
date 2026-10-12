import { isVacuumCleaning } from '../../../src/components/boxs/device-in-room/device-features/vacuum/vacuumFeatures';
import { VACUUM_CLEANER_MODE, VACUUM_CLEANER_STATE } from '../../../../server/utils/constants';

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
});
