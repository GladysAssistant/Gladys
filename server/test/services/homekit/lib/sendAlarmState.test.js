const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { stub } = sinon;
const { sendAlarmState } = require('../../../../services/homekit/lib/sendAlarmState');
const { ALARM_MODES } = require('../../../../utils/constants');

describe('Send alarm state to HomeKit', () => {
  const build = (alarmMode) => {
    const updateCharacteristic = stub();
    updateCharacteristic.returns({ updateCharacteristic });
    const accessory = { getService: stub().returns({ updateCharacteristic }) };

    const homekitHandler = {
      sendAlarmState,
      alarmAccessories: new Map([['maison', accessory]]),
      hap: {
        Service: { SecuritySystem: 'SECURITYSYSTEM' },
        Characteristic: {
          SecuritySystemCurrentState: 'CURRENTSTATE',
          SecuritySystemTargetState: 'TARGETSTATE',
        },
      },
      gladys: {
        house: { getBySelector: stub().resolves({ selector: 'maison', alarm_mode: alarmMode }) },
      },
    };

    return { homekitHandler, updateCharacteristic };
  };

  it('should push both states when the house is armed', async () => {
    const { homekitHandler, updateCharacteristic } = build(ALARM_MODES.ARMED);

    await homekitHandler.sendAlarmState('maison');

    expect(updateCharacteristic.args).to.eql([
      ['CURRENTSTATE', 1],
      ['TARGETSTATE', 1],
    ]);
  });

  it('should leave the target alone when the alarm goes off', async () => {
    const { homekitHandler, updateCharacteristic } = build(ALARM_MODES.PANIC);

    await homekitHandler.sendAlarmState('maison');

    // pushing disarmed on the target would show the alarm as switched off while it rings
    expect(updateCharacteristic.args).to.eql([['CURRENTSTATE', 4]]);
  });

  it('should do nothing for a house the bridge has no accessory for', async () => {
    const { homekitHandler, updateCharacteristic } = build(ALARM_MODES.ARMED);

    // a house created since the bridge was built has no accessory until the next reload
    await homekitHandler.sendAlarmState('maison-secondaire');

    expect(updateCharacteristic.callCount).to.equal(0);
    expect(homekitHandler.gladys.house.getBySelector.callCount).to.equal(0);
  });

  it('should report an alarm mode it does not know as disarmed', async () => {
    const { homekitHandler, updateCharacteristic } = build('something-else');

    await homekitHandler.sendAlarmState('maison');

    // leaving HomeKit alone would keep it showing a stale armed state
    expect(updateCharacteristic.args).to.eql([
      ['CURRENTSTATE', 3],
      ['TARGETSTATE', 3],
    ]);
  });
});
