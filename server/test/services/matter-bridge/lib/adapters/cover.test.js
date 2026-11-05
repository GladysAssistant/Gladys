const { expect } = require('chai');

const cover = require('../../../../../services/matter-bridge/lib/adapters/cover');
const { COVER_STATE } = require('../../../../../utils/constants');
const {
  MOVEMENT_TYPE,
  MOVEMENT_DIRECTION,
  WINDOW_COVERING_TYPE,
  END_PRODUCT_TYPE,
} = require('../../../../../services/matter-bridge/lib/constants');
const { createMatter, feature, createContext } = require('../../fakes');

const position = feature('shutter-position', 'shutter', 'position');
const state = feature('shutter-state', 'shutter', 'state');

describe('Matter bridge cover adapter', () => {
  const matter = createMatter();

  it('should pair the position and state of each cover', () => {
    const curtain = feature('curtain-state', 'curtain', 'state');
    expect(cover.claim([position, state, curtain, feature('x', 'shutter', 'other')])).to.deep.equal([
      { position, state },
      { state: curtain },
    ]);
  });

  it('should not claim the read-only features of a cover', () => {
    const readOnlyPosition = feature('ro-position', 'shutter', 'position', { read_only: true });
    const readOnlyState = feature('ro-state', 'shutter', 'state', { read_only: true });
    expect(cover.claim([readOnlyPosition, readOnlyState])).to.deep.equal([]);
    expect(cover.claim([readOnlyPosition, state])).to.deep.equal([{ state }]);
  });

  it('should build a shutter with a position', () => {
    const ctx = createContext({ 'shutter-position': 75 });
    const built = cover.build(matter, { position, state }, ctx);
    expect(built.state).to.deep.equal({
      windowCovering: {
        type: WINDOW_COVERING_TYPE.ROLLERSHADE,
        endProductType: END_PRODUCT_TYPE.ROLLER_SHUTTER,
        currentPositionLiftPercent100ths: 2500,
        targetPositionLiftPercent100ths: 2500,
      },
    });
    expect(built.type.name).to.equal('WindowCoveringDevice');
    const Behavior = built.type.behaviors[0];
    const behavior = new Behavior();

    behavior.handleMovement(MOVEMENT_TYPE.LIFT, false, MOVEMENT_DIRECTION.DEFINED_BY_POSITION, 0);
    behavior.handleMovement(MOVEMENT_TYPE.TILT, false, MOVEMENT_DIRECTION.CLOSE, 5000);
    expect(behavior.handleStopMovement()).to.equal('super-stop');
    expect(behavior.stopped).to.equal(true);
    expect(ctx.commands).to.deep.equal([
      ['shutter-position', 100],
      ['shutter-state', COVER_STATE.STOP],
    ]);
  });

  it('should build a curtain without a position', () => {
    const curtain = feature('curtain-state', 'curtain', 'state');
    const ctx = createContext({});
    const built = cover.build(matter, { state: curtain }, ctx);
    expect(built.state).to.deep.equal({
      windowCovering: { type: WINDOW_COVERING_TYPE.DRAPERY, endProductType: END_PRODUCT_TYPE.CENTRAL_CURTAIN },
    });
    const Behavior = built.type.behaviors[0];
    expect(Behavior.features).to.deep.equal(['Lift']);
    const behavior = new Behavior();
    behavior.handleMovement(MOVEMENT_TYPE.LIFT, false, MOVEMENT_DIRECTION.CLOSE);
    behavior.handleMovement(MOVEMENT_TYPE.LIFT, false, MOVEMENT_DIRECTION.OPEN);
    expect(ctx.commands).to.deep.equal([
      ['curtain-state', COVER_STATE.CLOSE],
      ['curtain-state', COVER_STATE.OPEN],
    ]);
  });

  it('should not send a stop to a cover without a state, nor read an unknown position', () => {
    const ctx = createContext({});
    const built = cover.build(matter, { position }, ctx);
    expect(built.type.behaviors[0].features).to.deep.equal(['Lift', 'PositionAwareLift']);
    expect(built.state.windowCovering).to.not.have.property('currentPositionLiftPercent100ths');
    const behavior = new built.type.behaviors[0]();
    behavior.handleStopMovement();
    behavior.handleMovement(MOVEMENT_TYPE.LIFT, false, MOVEMENT_DIRECTION.OPEN);
    expect(ctx.commands).to.deep.equal([]);
  });

  it('should only forward positions to Matter', () => {
    expect(cover.toMatter('position', 0, { position, state })).to.deep.equal({
      windowCovering: { currentPositionLiftPercent100ths: 10000, targetPositionLiftPercent100ths: 10000 },
    });
    expect(cover.toMatter('state', COVER_STATE.OPEN, { position, state })).to.equal(null);
  });
});
