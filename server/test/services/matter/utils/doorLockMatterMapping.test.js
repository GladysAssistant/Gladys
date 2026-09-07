const { expect } = require('chai');

const {
  DoorLock,
  // eslint-disable-next-line import/no-unresolved
} = require('@matter/main/clusters');

const {
  matterLockStateToGladys,
  matterLockStateToGladysBinary,
} = require('../../../../services/matter/utils/doorLockMatterMapping');
const { LOCK } = require('../../../../utils/constants');

describe('Matter.doorLockMatterMapping', () => {
  describe('matterLockStateToGladys', () => {
    it('should convert Locked to the Gladys locked state', () => {
      expect(matterLockStateToGladys(DoorLock.LockState.Locked)).to.eq(LOCK.STATE.LOCKED);
    });

    it('should convert Unlocked to the Gladys unlocked state', () => {
      expect(matterLockStateToGladys(DoorLock.LockState.Unlocked)).to.eq(LOCK.STATE.UNLOCKED);
    });

    it('should convert Unlatched to the Gladys unlocked state', () => {
      expect(matterLockStateToGladys(DoorLock.LockState.Unlatched)).to.eq(LOCK.STATE.UNLOCKED);
    });

    it('should convert NotFullyLocked to the Gladys activity state', () => {
      expect(matterLockStateToGladys(DoorLock.LockState.NotFullyLocked)).to.eq(LOCK.STATE.ACTIVITY);
    });

    it('should convert an unknown lock state to the Gladys error state', () => {
      expect(matterLockStateToGladys(null)).to.eq(LOCK.STATE.ERROR);
      expect(matterLockStateToGladys(42)).to.eq(LOCK.STATE.ERROR);
    });
  });

  describe('matterLockStateToGladysBinary', () => {
    it('should convert Locked to 1', () => {
      expect(matterLockStateToGladysBinary(DoorLock.LockState.Locked)).to.eq(LOCK.ACTION.LOCK);
    });

    it('should convert Unlocked to 0', () => {
      expect(matterLockStateToGladysBinary(DoorLock.LockState.Unlocked)).to.eq(LOCK.ACTION.UNLOCK);
    });

    it('should convert Unlatched to 0', () => {
      expect(matterLockStateToGladysBinary(DoorLock.LockState.Unlatched)).to.eq(LOCK.ACTION.UNLOCK);
    });

    it('should return null for a transient or unknown lock state', () => {
      expect(matterLockStateToGladysBinary(DoorLock.LockState.NotFullyLocked)).to.eq(null);
      expect(matterLockStateToGladysBinary(null)).to.eq(null);
    });
  });
});
