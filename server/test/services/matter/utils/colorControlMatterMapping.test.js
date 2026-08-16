const { expect } = require('chai');

const {
  matterXyToInt,
  intToMatterXy,
  isValidMireds,
  getColorTemperatureMiredsRange,
  DEFAULT_MIN_MIREDS,
  DEFAULT_MAX_MIREDS,
} = require('../../../../services/matter/utils/colorControlMatterMapping');

describe('Matter.colorControlMatterMapping', () => {
  describe('matterXyToInt', () => {
    it('should convert Matter XY red to the Gladys int color', () => {
      // 0.7006 * 65536 = 45918, 0.2993 * 65536 = 19617
      expect(matterXyToInt(45918, 19617)).to.equal(16711680);
    });

    it('should convert Matter XY green to the Gladys int color', () => {
      expect(matterXyToInt(11299, 48944)).to.equal(65280);
    });

    it('should convert Matter XY blue to the Gladys int color', () => {
      expect(matterXyToInt(8880, 2613)).to.equal(255);
    });

    it('should convert Matter XY white to the Gladys int color', () => {
      expect(matterXyToInt(21150, 21561)).to.equal(16777215);
    });
  });

  describe('intToMatterXy', () => {
    it('should convert the Gladys int red to Matter XY', () => {
      expect(intToMatterXy(16711680)).to.deep.equal({ colorX: 45915, colorY: 19615 });
    });

    it('should convert the Gladys int green to Matter XY', () => {
      expect(intToMatterXy(65280)).to.deep.equal({ colorX: 11299, colorY: 48942 });
    });

    it('should convert the Gladys int blue to Matter XY', () => {
      expect(intToMatterXy(255)).to.deep.equal({ colorX: 8880, colorY: 2613 });
    });

    it('should convert black to 0,0', () => {
      expect(intToMatterXy(0)).to.deep.equal({ colorX: 0, colorY: 0 });
    });

    it('should be the reverse of matterXyToInt', () => {
      [16711680, 65280, 255, 16777215, 14090213].forEach((intColor) => {
        const { colorX, colorY } = intToMatterXy(intColor);
        expect(matterXyToInt(colorX, colorY)).to.equal(intColor);
      });
    });
  });

  describe('isValidMireds', () => {
    it('should accept a valid mireds value', () => {
      expect(isValidMireds(250)).to.equal(true);
    });

    it('should reject a non number value', () => {
      expect(isValidMireds('250')).to.equal(false);
      expect(isValidMireds(null)).to.equal(false);
      expect(isValidMireds(undefined)).to.equal(false);
    });

    it('should reject a non finite value', () => {
      expect(isValidMireds(Number.POSITIVE_INFINITY)).to.equal(false);
      expect(isValidMireds(Number.NaN)).to.equal(false);
    });

    it('should reject a value out of the Matter uint16 range', () => {
      expect(isValidMireds(0)).to.equal(false);
      expect(isValidMireds(-1)).to.equal(false);
      expect(isValidMireds(65280)).to.equal(false);
    });
  });

  describe('getColorTemperatureMiredsRange', () => {
    it('should use the physical range advertised by the bulb', () => {
      expect(getColorTemperatureMiredsRange(200, 454)).to.deep.equal({ min: 200, max: 454 });
    });

    it('should fallback to the default min when the bulb does not advertise it', () => {
      expect(getColorTemperatureMiredsRange(undefined, 454)).to.deep.equal({ min: DEFAULT_MIN_MIREDS, max: 454 });
    });

    it('should fallback to the default max when the bulb does not advertise it', () => {
      expect(getColorTemperatureMiredsRange(200, undefined)).to.deep.equal({ min: 200, max: DEFAULT_MAX_MIREDS });
    });

    it('should fallback to the default range when the bulb advertises an inconsistent range', () => {
      expect(getColorTemperatureMiredsRange(500, 200)).to.deep.equal({
        min: DEFAULT_MIN_MIREDS,
        max: DEFAULT_MAX_MIREDS,
      });
      expect(getColorTemperatureMiredsRange(300, 300)).to.deep.equal({
        min: DEFAULT_MIN_MIREDS,
        max: DEFAULT_MAX_MIREDS,
      });
    });

    it('should fallback to the default range when the bulb advertises nothing', () => {
      expect(getColorTemperatureMiredsRange(null, null)).to.deep.equal({
        min: DEFAULT_MIN_MIREDS,
        max: DEFAULT_MAX_MIREDS,
      });
    });
  });
});
