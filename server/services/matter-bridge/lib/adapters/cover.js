const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, COVER_STATE } = require('../../../../utils/constants');
const { isNumber, toLiftPercent100ths, fromLiftPercent100ths } = require('../converters');
const { MOVEMENT_TYPE, MOVEMENT_DIRECTION, WINDOW_COVERING_TYPE, END_PRODUCT_TYPE } = require('../constants');
const { isFeature, zipRoles } = require('./helpers');

const COVER_CATEGORIES = [DEVICE_FEATURE_CATEGORIES.SHUTTER, DEVICE_FEATURE_CATEGORIES.CURTAIN];

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
    // eslint-disable-next-line class-methods-use-this
    handleMovement(type, reversed, direction, targetPercent100ths) {
      if (type === MOVEMENT_TYPE.LIFT) {
        moveCover(roles, ctx, direction, targetPercent100ths);
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

const cover = {
  key: 'cover',
  claim(features) {
    return COVER_CATEGORIES.flatMap((category) =>
      zipRoles({
        position: features.filter((f) => isFeature(f, category, [DEVICE_FEATURE_TYPES.SHUTTER.POSITION])),
        state: features.filter((f) => isFeature(f, category, [DEVICE_FEATURE_TYPES.SHUTTER.STATE])),
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
  toMatter(role, value, roles) {
    // A cover without a position cannot report one: Matter only knows its position attributes.
    if (role !== 'position') {
      return null;
    }
    const percent100ths = toLiftPercent100ths(value, roles.position);
    return {
      windowCovering: {
        currentPositionLiftPercent100ths: percent100ths,
        targetPositionLiftPercent100ths: percent100ths,
      },
    };
  },
  listeners: [],
};

module.exports = cover;
module.exports.moveCover = moveCover;
