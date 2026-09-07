const {
  DoorLock,
  // eslint-disable-next-line import/no-unresolved
} = require('@matter/main/clusters');

const { LOCK } = require('../../../utils/constants');

/**
 * @description Convert a Matter DoorLock lockState attribute to the Gladys lock state value.
 * @param {number|null|undefined} matterLockState - The Matter DoorLock lockState attribute.
 * @returns {number} The Gladys lock state (LOCK.STATE).
 * @example
 * const gladysState = matterLockStateToGladys(DoorLock.LockState.Locked);
 */
function matterLockStateToGladys(matterLockState) {
  switch (matterLockState) {
    case DoorLock.LockState.Locked:
      return LOCK.STATE.LOCKED;
    case DoorLock.LockState.Unlocked:
    case DoorLock.LockState.Unlatched:
      return LOCK.STATE.UNLOCKED;
    case DoorLock.LockState.NotFullyLocked:
      return LOCK.STATE.ACTIVITY;
    default:
      // A null lockState means the lock cannot report its current state
      return LOCK.STATE.ERROR;
  }
}

/**
 * @description Convert a Matter DoorLock lockState attribute to the Gladys binary lock value.
 * @param {number|null|undefined} matterLockState - The Matter DoorLock lockState attribute.
 * @returns {number|null} 1 when locked, 0 when unlocked, null when the state is unknown.
 * @example
 * const gladysBinaryState = matterLockStateToGladysBinary(DoorLock.LockState.Unlocked);
 */
function matterLockStateToGladysBinary(matterLockState) {
  switch (matterLockState) {
    case DoorLock.LockState.Locked:
      return LOCK.ACTION.LOCK;
    case DoorLock.LockState.Unlocked:
    case DoorLock.LockState.Unlatched:
      return LOCK.ACTION.UNLOCK;
    default:
      // NotFullyLocked or an unknown state is not a stable binary value
      return null;
  }
}

module.exports = {
  matterLockStateToGladys,
  matterLockStateToGladysBinary,
};
