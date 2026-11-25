const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, COVER_STATE } = require('../../../../utils/constants');
const { isNumber, toLiftPercent100ths, fromLiftPercent100ths } = require('../converters');
const {
  MOVEMENT_TYPE,
  MOVEMENT_STATUS,
  MOVEMENT_DIRECTION,
  WINDOW_COVERING_TYPE,
  END_PRODUCT_TYPE,
  COVER_MOVEMENT_TIMEOUT_MS,
} = require('../constants');
const { isFeature, isWritable, zipRoles } = require('./helpers');

const COVER_CATEGORIES = [DEVICE_FEATURE_CATEGORIES.SHUTTER, DEVICE_FEATURE_CATEGORIES.CURTAIN];

// How far, in Gladys position steps, a cover may stop from the target a Matter app sent it to and
// still count as having reached it.
const REACHED_TOLERANCE = 1;

const STOPPED = {
  global: MOVEMENT_STATUS.STOPPED,
  lift: MOVEMENT_STATUS.STOPPED,
  tilt: MOVEMENT_STATUS.STOPPED,
};

/**
 * @description Tell if Matter reports a cover as opening or closing.
 * @param {object} windowCovering - Window covering state of the endpoint.
 * @returns {boolean} True while a movement is under way.
 * @example
 * isMoving(endpoint.state.windowCovering);
 */
function isMoving(windowCovering) {
  return Boolean(windowCovering.operationalStatus) && windowCovering.operationalStatus.lift !== MOVEMENT_STATUS.STOPPED;
}

/**
 * @description End the movement of a cover where it is. The status is set as well as the target:
 * matter.js only recomputes the status when the target changes, and a cover asked to go where it
 * already is would otherwise stay opening or closing.
 * @param {object} windowCovering - Window covering state of the endpoint.
 * @returns {object} The patch ending the movement.
 * @example
 * endMovement(endpoint.state.windowCovering);
 */
function endMovement(windowCovering) {
  const patch = { operationalStatus: STOPPED };
  if (isNumber(windowCovering.currentPositionLiftPercent100ths)) {
    patch.targetPositionLiftPercent100ths = windowCovering.currentPositionLiftPercent100ths;
  }
  return { windowCovering: patch };
}

/**
 * @description Forward a movement asked by a Matter app to the Gladys cover. A position is sent
 * when the cover has one and Matter gave a target, otherwise an open or close order.
 * @param {object} roles - Features of the cover, by role.
 * @param {object} ctx - Build context, carrying the command sender.
 * @param {number} direction - Matter movement direction.
 * @param {number} [targetPercent100ths] - Matter target position, 0 (open) to 10000 (closed).
 * @returns {undefined}
 * @example
 * moveCover({ position }, ctx, MOVEMENT_DIRECTION.DEFINED_BY_POSITION, 2500);
 */
function moveCover(roles, ctx, direction, targetPercent100ths) {
  if (roles.position && isNumber(targetPercent100ths)) {
    ctx.command(roles.position, fromLiftPercent100ths(targetPercent100ths, roles.position));
    return;
  }
  if (roles.state) {
    ctx.command(roles.state, direction === MOVEMENT_DIRECTION.CLOSE ? COVER_STATE.CLOSE : COVER_STATE.OPEN);
  }
}

/**
 * @description Build the window covering behavior of one cover. Matter apps do not write the
 * position attributes: they send commands, which matter.js turns into handleMovement and
 * handleStopMovement calls. Those are overridden to drive the Gladys cover instead of simulating
 * a movement, so the reported position only ever follows the real one.
 * @param {object} matter - The matter.js modules.
 * @param {object} roles - Features of the cover, by role.
 * @param {object} ctx - Build context, carrying the command sender.
 * @returns {Function} The matter.js behavior class.
 * @example
 * coverBehavior(matter, { position, state }, ctx);
 */
function coverBehavior(matter, roles, ctx) {
  const features = roles.position ? ['Lift', 'PositionAwareLift'] : ['Lift'];
  const Base = matter.behaviors.WindowCoveringServer.with(...features);

  return class GladysWindowCoveringServer extends Base {
    // An override of a matter.js method, which matter.js calls on the behavior instance.
    handleMovement(type, reversed, direction, targetPercent100ths) {
      if (type !== MOVEMENT_TYPE.LIFT) {
        return;
      }
      moveCover(roles, ctx, direction, targetPercent100ths);
      // matter.js reports the cover as opening or closing before this call. A cover with a
      // position stops once it reaches its target, stops on the way or stops reporting its
      // position (see toMatter and settle); one without can never tell when it does, so it is
      // reported still at once rather than moving forever.
      if (roles.position) {
        ctx.moved(roles.position);
      } else {
        this.state.operationalStatus = STOPPED;
      }
    }

    handleStopMovement() {
      if (roles.state) {
        ctx.command(roles.state, COVER_STATE.STOP);
      }
      return super.handleStopMovement();
    }
  };
}

/**
 * @description Pick the writable features of a cover role.
 * @param {Array} features - Unclaimed features of the device.
 * @param {string} category - Gladys cover category.
 * @param {string} type - Gladys cover feature type.
 * @returns {Array} The matching features.
 * @example
 * coverFeatures(features, 'shutter', 'position');
 */
function coverFeatures(features, category, type) {
  return features.filter((feature) => isFeature(feature, category, [type]) && isWritable(feature));
}

// Matter apps move a window covering, so only the features Gladys can set are claimed: a cover
// that only reports its position or its state is not offered as one Matter could open.
const cover = {
  key: 'cover',
  claim(features) {
    return COVER_CATEGORIES.flatMap((category) =>
      zipRoles({
        position: coverFeatures(features, category, DEVICE_FEATURE_TYPES.SHUTTER.POSITION),
        state: coverFeatures(features, category, DEVICE_FEATURE_TYPES.SHUTTER.STATE),
      }),
    );
  },
  build(matter, roles, ctx) {
    const { category } = roles.position || roles.state;
    const curtain = category === DEVICE_FEATURE_CATEGORIES.CURTAIN;
    const windowCovering = {
      type: curtain ? WINDOW_COVERING_TYPE.DRAPERY : WINDOW_COVERING_TYPE.ROLLERSHADE,
      endProductType: curtain ? END_PRODUCT_TYPE.CENTRAL_CURTAIN : END_PRODUCT_TYPE.ROLLER_SHUTTER,
    };
    const position = roles.position ? ctx.read(roles.position) : null;
    if (isNumber(position)) {
      const percent100ths = toLiftPercent100ths(position, roles.position);
      windowCovering.currentPositionLiftPercent100ths = percent100ths;
      windowCovering.targetPositionLiftPercent100ths = percent100ths;
    }
    return {
      type: matter.devices.WindowCoveringDevice.with(coverBehavior(matter, roles, ctx)),
      state: { windowCovering },
    };
  },
  toMatter(role, value, roles, state) {
    const current = (state && state.windowCovering) || {};
    const moving = isMoving(current);
    // A cover without a position cannot report one: Matter only knows its position attributes. Its
    // state only matters when it says the cover stopped: the movement is then over, wherever the
    // cover is.
    if (role !== 'position') {
      return role === 'state' && value === COVER_STATE.STOP && moving ? endMovement(current) : null;
    }
    const percent100ths = toLiftPercent100ths(value, roles.position);
    const windowCovering = { currentPositionLiftPercent100ths: percent100ths };
    if (!moving) {
      // A still cover: the target follows the position.
      windowCovering.targetPositionLiftPercent100ths = percent100ths;
      return { windowCovering };
    }
    // While a movement a Matter app asked for is under way, the positions Gladys reports on the
    // way only move the current position: the target stays the one asked for, and matter.js
    // reports the cover as opening or closing. The movement ends once the cover reached the target,
    // Gladys positions being coarser than Matter ones: many covers stop one step short of (or past)
    // the position they were sent to, so a position within REACHED_TOLERANCE of the target counts as
    // reached. It also ends when the cover moves away from the target: stopped and sent the other
    // way (a wall switch, a Gladys scene), it will never reach it.
    if (isNumber(current.targetPositionLiftPercent100ths)) {
      const target = fromLiftPercent100ths(current.targetPositionLiftPercent100ths, roles.position);
      const distance = Math.abs(target - value);
      const previous = isNumber(current.currentPositionLiftPercent100ths)
        ? Math.abs(target - fromLiftPercent100ths(current.currentPositionLiftPercent100ths, roles.position))
        : distance;
      if (distance <= REACHED_TOLERANCE || distance > previous + REACHED_TOLERANCE) {
        windowCovering.targetPositionLiftPercent100ths = percent100ths;
        windowCovering.operationalStatus = STOPPED;
      }
    }
    return { windowCovering };
  },
  // A cover stopped on the way may never report a position again: once a movement went without any
  // for COVER_MOVEMENT_TIMEOUT_MS, it is ended where the cover was last seen. The bindings arm the
  // delay when the movement starts (ctx.moved) and with each position pushed meanwhile.
  settle: {
    role: 'position',
    delayMs: COVER_MOVEMENT_TIMEOUT_MS,
    toMatter(state) {
      const current = state.windowCovering || {};
      return isMoving(current) ? endMovement(current) : null;
    },
  },
  listeners: [],
};

module.exports = cover;
module.exports.moveCover = moveCover;
