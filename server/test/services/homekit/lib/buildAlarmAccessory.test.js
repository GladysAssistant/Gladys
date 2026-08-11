const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { stub } = sinon;
const { buildAlarmAccessory } = require('../../../../services/homekit/lib/buildAlarmAccessory');
const { ALARM_MODES } = require('../../../../utils/constants');

const HOUSE = { id: 'e1b0a9cf-3f6f-4f2e-9f6b-2c0a7f4a1d55', name: 'Maison', selector: 'maison' };

const buildAlarmHapStub = () => {
  const characteristics = {};
  const getCharacteristic = (name) => {
    if (!characteristics[name]) {
      characteristics[name] = { handlers: {}, setProps: stub(), on: stub() };
      characteristics[name].on = (event, handler) => {
        characteristics[name].handlers[event] = handler;
        return characteristics[name];
      };
    }
    return characteristics[name];
  };

  const service = { getCharacteristic: stub().callsFake(getCharacteristic) };
  const addService = stub();

  const hap = {
    Accessory: stub().returns({ addService }),
    Service: { SecuritySystem: stub().returns(service) },
    Characteristic: {
      SecuritySystemCurrentState: 'CURRENTSTATE',
      SecuritySystemTargetState: 'TARGETSTATE',
    },
    CharacteristicEventTypes: { GET: 'get', SET: 'set' },
  };

  return { hap, characteristics, addService };
};

const readCharacteristic = (characteristic) =>
  new Promise((resolve) => {
    characteristic.handlers.get((error, value) => resolve(value));
  });

describe('Build alarm accessory', () => {
  const build = (alarmMode) => {
    const { hap, characteristics, addService } = buildAlarmHapStub();
    const homekitHandler = {
      buildAlarmAccessory,
      hap,
      gladys: {
        house: {
          getBySelector: stub().resolves({ ...HOUSE, alarm_mode: alarmMode }),
          arm: stub().resolves(),
          partialArm: stub().resolves(),
          disarm: stub().resolves(),
        },
      },
    };

    return { homekitHandler, characteristics, addService, accessory: homekitHandler.buildAlarmAccessory(HOUSE) };
  };

  it('should build an accessory named after the house and keyed by its id', async () => {
    const { homekitHandler, addService } = build(ALARM_MODES.DISARMED);

    expect(homekitHandler.hap.Accessory.args[0]).to.eql(['Maison', HOUSE.id]);
    expect(addService.callCount).to.equal(1);
  });

  it('should report every alarm mode Gladys knows', async () => {
    const cases = [
      [ALARM_MODES.DISARMED, 3],
      [ALARM_MODES.ARMED, 1],
      // Gladys arms part of the house where HomeKit calls it staying home: the same idea seen from
      // the other side
      [ALARM_MODES.PARTIALLY_ARMED, 0],
      [ALARM_MODES.PANIC, 4],
    ];

    await Promise.all(
      cases.map(async ([alarmMode, expected]) => {
        const { characteristics } = build(alarmMode);
        expect(await readCharacteristic(characteristics.CURRENTSTATE)).to.equal(expected);
      }),
    );
  });

  it('should report the target the house was set to', async () => {
    const { characteristics } = build(ALARM_MODES.PARTIALLY_ARMED);

    expect(await readCharacteristic(characteristics.TARGETSTATE)).to.equal(0);
  });

  it('should keep the target armed while the alarm is going off', async () => {
    const { characteristics } = build(ALARM_MODES.PANIC);

    // HomeKit has no triggered target, and reporting disarmed there would show the alarm as
    // switched off while it rings
    expect(await readCharacteristic(characteristics.CURRENTSTATE)).to.equal(4);
    expect(await readCharacteristic(characteristics.TARGETSTATE)).to.equal(1);
  });

  it('should not offer the night mode Gladys has no equivalent for', async () => {
    const { characteristics } = build(ALARM_MODES.DISARMED);

    expect(characteristics.TARGETSTATE.setProps.args[0][0]).to.eql({ validValues: [0, 1, 3] });
  });

  it('should report an unknown alarm mode as disarmed', async () => {
    const { characteristics } = build('something-else');

    // announcing a break-in that is not happening is the worse of the two mistakes
    expect(await readCharacteristic(characteristics.CURRENTSTATE)).to.equal(3);
  });

  it('should arm, partially arm and disarm the house', async () => {
    const { homekitHandler, characteristics } = build(ALARM_MODES.DISARMED);
    const cb = stub();

    await characteristics.TARGETSTATE.handlers.set(1, cb);
    await characteristics.TARGETSTATE.handlers.set(0, cb);
    await characteristics.TARGETSTATE.handlers.set(3, cb);

    expect(homekitHandler.gladys.house.arm.args).to.eql([['maison']]);
    expect(homekitHandler.gladys.house.partialArm.args).to.eql([['maison']]);
    expect(homekitHandler.gladys.house.disarm.args).to.eql([['maison']]);
    expect(cb.callCount).to.equal(3);
  });

  it('should answer without failing when the house is already in the mode asked for', async () => {
    const { homekitHandler, characteristics } = build(ALARM_MODES.ARMED);
    homekitHandler.gladys.house.arm = stub().rejects(new Error('House is already armed'));
    const cb = stub();

    await characteristics.TARGETSTATE.handlers.set(1, cb);

    // the Home app does this whenever two people press the same button: the house is in the state
    // that was asked for either way
    expect(cb.callCount).to.equal(1);
    expect(cb.args[0]).to.eql([]);
  });
});
