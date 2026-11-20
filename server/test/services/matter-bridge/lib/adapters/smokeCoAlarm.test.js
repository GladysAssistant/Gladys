const { expect } = require('chai');

const smokeCoAlarm = require('../../../../../services/matter-bridge/lib/adapters/smokeCoAlarm');
const { ALARM_STATE, EXPRESSED_STATE } = require('../../../../../services/matter-bridge/lib/constants');
const { createMatter, feature, createContext } = require('../../fakes');

const smoke = feature('smoke', 'smoke-sensor', 'binary');
const co = feature('co', 'co-sensor', 'binary');

describe('Matter bridge smoke and CO alarm adapter', () => {
  const matter = createMatter();

  it('should group the smoke and CO detections of a device', () => {
    expect(smokeCoAlarm.claim([smoke, co, feature('x', 'co-sensor', 'decimal')])).to.deep.equal([{ smoke, co }]);
    expect(smokeCoAlarm.requiresPowerSource).to.equal(true);
  });

  it('should build an alarm detecting both', () => {
    const built = smokeCoAlarm.build(matter, { smoke, co }, createContext({ co: 1 }));
    expect(built.type.name).to.equal('SmokeCoAlarmDevice');
    expect(built.type.behaviors[0].features).to.deep.equal(['SmokeAlarm', 'CoAlarm']);
    expect(built.state.smokeCoAlarm).to.include({
      smokeState: ALARM_STATE.NORMAL,
      coState: ALARM_STATE.CRITICAL,
      expressedState: EXPRESSED_STATE.CO_ALARM,
    });
  });

  it('should build a smoke only alarm', () => {
    const built = smokeCoAlarm.build(matter, { smoke }, createContext({ smoke: 1 }));
    expect(built.type.behaviors[0].features).to.deep.equal(['SmokeAlarm']);
    expect(built.state.smokeCoAlarm).to.include({
      smokeState: ALARM_STATE.CRITICAL,
      expressedState: EXPRESSED_STATE.SMOKE_ALARM,
    });
    expect(built.state.smokeCoAlarm).to.not.have.property('coState');
  });

  it('should build a CO only alarm with an unknown state', () => {
    const built = smokeCoAlarm.build(matter, { co }, createContext({}));
    expect(built.state.smokeCoAlarm).to.include({
      coState: ALARM_STATE.NORMAL,
      expressedState: EXPRESSED_STATE.NORMAL,
    });
  });

  it('should forward detections with the overall state', () => {
    const endpointState = { smokeCoAlarm: { smokeState: ALARM_STATE.NORMAL, coState: ALARM_STATE.CRITICAL } };
    expect(smokeCoAlarm.toMatter('smoke', 1, { smoke, co }, endpointState)).to.deep.equal({
      smokeCoAlarm: { smokeState: ALARM_STATE.CRITICAL, expressedState: EXPRESSED_STATE.SMOKE_ALARM },
    });
    expect(smokeCoAlarm.toMatter('co', 0, { smoke, co }, endpointState)).to.deep.equal({
      smokeCoAlarm: { coState: ALARM_STATE.NORMAL, expressedState: EXPRESSED_STATE.NORMAL },
    });
  });
});
