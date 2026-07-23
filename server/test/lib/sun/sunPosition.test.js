const { expect } = require('chai');
const sinon = require('sinon');
const suncalc = require('suncalc');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const {
  toDegrees,
  azimuthDifference,
  matchesSunPosition,
  findSunPositionTimes,
} = require('../../../lib/sun/sunPosition');

describe('sunPosition', () => {
  describe('toDegrees', () => {
    it('should convert suncalc radians to altitude and azimuth degrees', () => {
      const position = { altitude: Math.PI / 4, azimuth: 0 };
      const result = toDegrees(position);
      expect(result.altitude).to.be.closeTo(45, 0.01);
      expect(result.azimuth).to.be.closeTo(180, 0.01);
    });
  });

  describe('azimuthDifference', () => {
    it('should compute smallest difference across the 0/360 boundary', () => {
      expect(azimuthDifference(359, 1)).to.equal(2);
      expect(azimuthDifference(10, 350)).to.equal(20);
      expect(azimuthDifference(90, 90)).to.equal(0);
    });
  });

  describe('matchesSunPosition', () => {
    it('should match when altitude and azimuth are within tolerance', () => {
      expect(matchesSunPosition(31, 160, 31.3, 160.5)).to.equal(true);
      expect(matchesSunPosition(31, 160, 35, 160)).to.equal(false);
      expect(matchesSunPosition(31, 160, 31, 170)).to.equal(false);
    });
  });

  describe('findSunPositionTimes', () => {
    it('should find times when sun reaches target altitude and azimuth on summer solstice in Paris', () => {
      const clock = sinon.useFakeTimers(new Date('2026-06-21T06:00:00Z').getTime());
      try {
        const times = findSunPositionTimes(suncalc, 48.8566, 2.3522, 'Europe/Paris', 60, 140);
        expect(times.length).to.be.greaterThan(0);
        const firstMatch = dayjs(times[0]).tz('Europe/Paris');
        expect(firstMatch.hour()).to.equal(12);
        expect(firstMatch.minute()).to.be.within(28, 36);
      } finally {
        clock.restore();
      }
    });

    it('should return empty array when no match exists today', () => {
      const clock = sinon.useFakeTimers(new Date('2026-06-21T06:00:00Z').getTime());
      try {
        const times = findSunPositionTimes(suncalc, 48.8566, 2.3522, 'Europe/Paris', 31, 160);
        expect(times).to.deep.equal([]);
      } finally {
        clock.restore();
      }
    });
  });
});
