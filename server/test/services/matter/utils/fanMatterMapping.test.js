const { expect } = require('chai');

const {
  FanControl,
  // eslint-disable-next-line import/no-unresolved
} = require('@matter/main/clusters');
const { FAN_MODE } = require('../../../../utils/constants');
const {
  matterFanModeToGladys,
  gladysFanModeToMatter,
  matterAttributeToNumber,
} = require('../../../../services/matter/utils/fanMatterMapping');

describe('Matter fanMatterMapping', () => {
  it('should convert Matter fan modes to Gladys fan modes', () => {
    expect(matterFanModeToGladys(0)).to.eq(FAN_MODE.OFF);
    expect(matterFanModeToGladys(1)).to.eq(FAN_MODE.LOW);
    expect(matterFanModeToGladys(2)).to.eq(FAN_MODE.MEDIUM);
    expect(matterFanModeToGladys(3)).to.eq(FAN_MODE.HIGH);
    expect(matterFanModeToGladys(4)).to.eq(FAN_MODE.HIGH);
    expect(matterFanModeToGladys(5)).to.eq(FAN_MODE.AUTO);
    expect(matterFanModeToGladys(6)).to.eq(FAN_MODE.AUTO);
  });

  it('should convert Gladys fan modes to Matter fan modes', () => {
    expect(gladysFanModeToMatter(FAN_MODE.OFF)).to.eq(0);
    expect(gladysFanModeToMatter(FAN_MODE.LOW)).to.eq(1);
    expect(gladysFanModeToMatter(FAN_MODE.MEDIUM)).to.eq(2);
    expect(gladysFanModeToMatter(FAN_MODE.HIGH)).to.eq(3);
    expect(gladysFanModeToMatter(FAN_MODE.AUTO)).to.eq(5);
  });

  it('should return unknown values unchanged', () => {
    expect(matterFanModeToGladys(99)).to.eq(99);
    expect(gladysFanModeToMatter(99)).to.eq(99);
  });

  it('should convert Matter bitmap attribute objects to numbers', () => {
    const rockSupportSchema = FanControl.Complete.attributes.rockSupport.schema;
    const windSupportSchema = FanControl.Complete.attributes.windSupport.schema;

    expect(matterAttributeToNumber(7)).to.eq(7);
    expect(
      matterAttributeToNumber({ rockLeftRight: true, rockUpDown: true, rockRound: true }, rockSupportSchema),
    ).to.eq(7);
    expect(matterAttributeToNumber({ sleepWind: true, naturalWind: true }, windSupportSchema)).to.eq(3);
    expect(matterAttributeToNumber({ rockLeftRight: true }, rockSupportSchema)).to.eq(1);
    expect(matterAttributeToNumber(null, rockSupportSchema)).to.eq(undefined);
    expect(matterAttributeToNumber('7')).to.eq(7);
    expect(matterAttributeToNumber(undefined, rockSupportSchema)).to.eq(undefined);
    expect(matterAttributeToNumber({})).to.eq(undefined);
  });
});
