const { expect } = require('chai');
const {
  intToHex,
  hexToInt,
  intToRgb,
  rgbToInt,
  xyToInt,
  hsbToRgb,
  rgbToHsb,
  kelvinToRGB,
} = require('../../utils/colors');

describe('colors', () => {
  const matchingTable = {
    cyan: { int: 65535, hex: '00FFFF', rgb: [0, 255, 255], hsb: [180, 100, 100] },
    violet: { int: 16711935, hex: 'FF00FF', rgb: [255, 0, 255], hsb: [300, 100, 100] },
    yellow: { int: 16776960, hex: 'FFFF00', rgb: [255, 255, 0], hsb: [60, 100, 100] },
    red: { int: 16711680, hex: 'FF0000', rgb: [255, 0, 0], xy: { x: 0.701, y: 0.299 }, hsb: [0, 100, 100] },
    lime: { int: 65280, hex: '00FF00', rgb: [0, 255, 0], xy: { x: 0, y: 1 }, hsb: [120, 100, 100] },
    blue: { int: 255, hex: '0000FF', rgb: [0, 0, 255], hsb: [240, 100, 100] },
    teal: { int: 32896, hex: '008080', rgb: [0, 128, 128], hsb: [180, 100, 50] },
    purple: { int: 8388736, hex: '800080', rgb: [128, 0, 128], hsb: [300, 100, 50] },
    olive: { int: 8421376, hex: '808000', rgb: [128, 128, 0], hsb: [60, 100, 50] },
    maroon: { int: 8388608, hex: '800000', rgb: [128, 0, 0], hsb: [0, 100, 50] },
    green: { int: 32768, hex: '008000', rgb: [0, 128, 0], hsb: [120, 100, 50] },
    navy: { int: 128, hex: '000080', rgb: [0, 0, 128], hsb: [240, 100, 50] },
    white: { int: 16777215, hex: 'FFFFFF', rgb: [255, 255, 255], xy: { x: 0.323, y: 0.329 }, hsb: [0, 0, 100] },
    gray: { int: 12632256, hex: 'C0C0C0', rgb: [192, 192, 192] },
    black: { int: 0, hex: '000000', rgb: [0, 0, 0], xy: { x: 0, y: 0 }, hsb: [0, 0, 0] },
  };

  Object.keys(matchingTable).forEach((color) => {
    const { int, hex, rgb, xy, hsb } = matchingTable[color];

    it(`[${color}] intToHex (${int} -> ${hex})`, () => {
      const value = intToHex(int);
      expect(value).to.equal(hex.toLowerCase());
    });

    it(`[${color}] hexToInt (${hex} -> ${int})`, () => {
      const value = hexToInt(hex);
      expect(value).to.equal(int);
    });

    it(`[${color}] hexToInt #prefixed (#${hex} -> ${int})`, () => {
      const value = hexToInt(`#${hex}`);
      expect(value).to.equal(int);
    });

    it(`[${color}] intToRgb (${int} -> ${rgb})`, () => {
      const value = intToRgb(int);
      expect(value).to.deep.equal(rgb);
    });

    it(`[${color}] rgbToInt (${rgb} -> ${int})`, () => {
      const value = rgbToInt(rgb);
      expect(value).to.equal(int);
    });

    if (hsb) {
      it(`[${color}] rgbToHsb (${rgb} -> ${hsb})`, () => {
        const value = rgbToHsb(rgb);
        expect(value).to.deep.equal(hsb);
      });
      it(`[${color}] hsbToRgb (${hsb} -> ${rgb})`, () => {
        const value = hsbToRgb(hsb);
        expect(value).to.deep.equal(rgb);
      });
    }

    if (xy) {
      it(`[${color}] xyToInt (${xy.x}, ${xy.y} -> ${int})`, () => {
        const value = xyToInt(xy.x, xy.y);
        expect(value).to.equal(int);
      });
    }
  });
});

describe('ColorTemperature', () => {
  const kelvinInRgb = [
    { kelvin: 0, rgb: [255, 0, 0] },
    { kelvin: 1901, rgb: [255, 132, 0] },
    { kelvin: 2000, rgb: [255, 137, 14] },
    { kelvin: 5000, rgb: [255, 228, 206] },
    { kelvin: 8000, rgb: [221, 230, 255] },
    { kelvin: 6600, rgb: [255, 255, 255] },
  ];
  kelvinInRgb.forEach((color) => {
    it(`color ${color.kelvin}K should equal ${color.rgb} in RGB`, () => {
      const value = kelvinToRGB(color.kelvin);
      expect(value).to.deep.equal(color.rgb);
    });
  });
  it('should try all Kelvin from 0 to 50k', function Test() {
    this.timeout(10000);
    for (let i = 0; i < 50000; i += 1) {
      const [r, g, b] = kelvinToRGB(i);
      expect(r).to.be.greaterThanOrEqual(0);
      expect(g).to.be.greaterThanOrEqual(0);
      expect(b).to.be.greaterThanOrEqual(0);
      expect(r).to.be.lessThanOrEqual(255);
      expect(g).to.be.lessThanOrEqual(255);
      expect(b).to.be.lessThanOrEqual(255);
    }
  });
});
