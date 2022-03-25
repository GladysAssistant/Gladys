const { expect } = require('chai');
const { intToHex, hexToInt, intToRgb, rgbToInt, xyToInt, hsvToInt, intToHsv } = require('../../utils/colors');

describe('colors', () => {
  const matchingTable = {
    cyan: { int: 65535, hex: '00FFFF', rgb: [0, 255, 255], hsv: { h: 180, s: 100, v: 100 } },
    violet: { int: 16711935, hex: 'FF00FF', rgb: [255, 0, 255], hsv: { h: 300, s: 100, v: 100 } },
    yellow: { int: 16776960, hex: 'FFFF00', rgb: [255, 255, 0], hsv: { h: 60, s: 100, v: 100 } },
    red: { int: 16711680, hex: 'FF0000', rgb: [255, 0, 0], xy: { x: 0.701, y: 0.299 }, hsv: { h: 0, s: 100, v: 100 } },
    lime: { int: 65280, hex: '00FF00', rgb: [0, 255, 0], xy: { x: 0, y: 1 }, hsv: { h: 120, s: 100, v: 100 } },
    blue: { int: 255, hex: '0000FF', rgb: [0, 0, 255], hsv: { h: 240, s: 100, v: 100 } },
    teal: { int: 32896, hex: '008080', rgb: [0, 128, 128], hsv: { h: 180, s: 100, v: 50.2 } },
    purple: { int: 8388736, hex: '800080', rgb: [128, 0, 128], hsv: { h: 300, s: 100, v: 50.2 } },
    olive: { int: 8421376, hex: '808000', rgb: [128, 128, 0], hsv: { h: 60, s: 100, v: 50.2 } },
    maroon: { int: 8388608, hex: '800000', rgb: [128, 0, 0], hsv: { h: 0, s: 100, v: 50.2 } },
    green: { int: 32768, hex: '008000', rgb: [0, 128, 0], hsv: { h: 120, s: 100, v: 50.2 } },
    navy: { int: 128, hex: '000080', rgb: [0, 0, 128], hsv: { h: 240, s: 100, v: 50.2 } },
    white: {
      int: 16777215,
      hex: 'FFFFFF',
      rgb: [255, 255, 255],
      xy: { x: 0.323, y: 0.329 },
      hsv: { h: 0, s: 0, v: 100 },
    },
    gray: { int: 12632256, hex: 'C0C0C0', rgb: [192, 192, 192], hsv: { h: 0, s: 0, v: 75.3 } },
    black: { int: 0, hex: '000000', rgb: [0, 0, 0], xy: { x: 0, y: 0 }, hsv: { h: 0, s: 0, v: 0 } },
  };

  Object.keys(matchingTable).forEach((color) => {
    const { int, hex, rgb, xy, hsv } = matchingTable[color];

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

    if (xy) {
      it(`[${color}] xyToInt (${xy.x}, ${xy.y} -> ${int})`, () => {
        const value = xyToInt(xy.x, xy.y);
        expect(value).to.equal(int);
      });
    }

    it(`[${color}] hsvToInt ({ h: ${hsv.h}, s: ${hsv.s}, v: ${hsv.v} } -> ${int})`, () => {
      const value = hsvToInt(hsv);
      expect(value).to.equal(int);
    });

    it(`[${color}] intToHsv (${int} -> { h: ${hsv.h}, s: ${hsv.s}, v: ${hsv.v} })`, () => {
      const value = intToHsv(int);
      expect(value).to.deep.equal(hsv);
    });
  });
});
