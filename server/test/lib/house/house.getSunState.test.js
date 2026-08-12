const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezonePlugin = require('dayjs/plugin/timezone');

const { fake } = sinon;

const House = require('../../../lib/house');

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const event = {
  emit: fake.returns(null),
};

const buildHouse = (timezone) => {
  const variable = {
    getValue: fake.resolves(timezone),
  };
  return new House(event, {}, {}, variable);
};

describe('house.getSunState', () => {
  const house = buildHouse('Europe/Paris');
  const parisHouse = { latitude: 48.8566, longitude: 2.3522 };
  // Midday UTC on a summer day, the sun is up in Paris
  const summerNoon = new Date('2026-07-05T12:00:00.000Z');

  it('should return sun times in chronological order', async () => {
    const sunState = await house.getSunState(parisHouse, summerNoon);
    expect(sunState.dawn.getTime()).to.be.below(sunState.sunrise.getTime());
    expect(sunState.sunrise.getTime()).to.be.below(sunState.solar_noon.getTime());
    expect(sunState.solar_noon.getTime()).to.be.below(sunState.sunset.getTime());
    expect(sunState.sunset.getTime()).to.be.below(sunState.dusk.getTime());
  });

  it('should return current azimuth and elevation in degrees', async () => {
    const sunState = await house.getSunState(parisHouse, summerNoon);
    expect(sunState.azimuth).to.be.a('number');
    expect(sunState.azimuth).to.be.at.least(0);
    expect(sunState.azimuth).to.be.below(360);
    // The sun is high in the sky at midday in July in Paris
    expect(sunState.elevation).to.be.above(45);
  });

  it('should return a full day elevation curve', async () => {
    const sunState = await house.getSunState(parisHouse, summerNoon);
    // One point every 20 minutes from local midnight to the next one included
    expect(sunState.curve).to.have.lengthOf(73);
    sunState.curve.forEach((point) => {
      expect(point.time).to.be.a('date');
      expect(point.elevation).to.be.a('number');
    });
    const maxElevation = Math.max(...sunState.curve.map((point) => point.elevation));
    const minElevation = Math.min(...sunState.curve.map((point) => point.elevation));
    // In Paris in July, the sun goes well above the horizon during the day and below at night
    expect(maxElevation).to.be.above(45);
    expect(minElevation).to.be.below(0);
  });

  it('should default to Europe/Paris when no timezone is configured', async () => {
    const houseWithoutTimezone = buildHouse(null);
    const sunState = await houseWithoutTimezone.getSunState(parisHouse, summerNoon);
    const startOfCurve = dayjs(sunState.curve[0].time).tz('Europe/Paris');
    expect(startOfCurve.hour()).to.equal(0);
    expect(startOfCurve.minute()).to.equal(0);
  });

  it('should build the curve on the local day of the configured timezone', async () => {
    const tokyoHouse = { latitude: 35.6762, longitude: 139.6503 };
    const tokyoHouseInstance = buildHouse('Asia/Tokyo');
    // 06:00 UTC = 15:00 in Tokyo, so the local day is not the UTC day
    const tokyoAfternoon = new Date('2026-07-05T06:00:00.000Z');
    const sunState = await tokyoHouseInstance.getSunState(tokyoHouse, tokyoAfternoon);

    // The curve must start at local midnight in Tokyo
    const startOfCurve = dayjs(sunState.curve[0].time).tz('Asia/Tokyo');
    expect(startOfCurve.hour()).to.equal(0);
    expect(startOfCurve.minute()).to.equal(0);

    // Sunrise and sunset must fall inside the curve window, not before it
    const curveStart = sunState.curve[0].time.getTime();
    const curveEnd = sunState.curve[sunState.curve.length - 1].time.getTime();
    expect(sunState.sunrise.getTime()).to.be.above(curveStart);
    expect(sunState.sunrise.getTime()).to.be.below(curveEnd);
    expect(sunState.sunset.getTime()).to.be.above(sunState.sunrise.getTime());
    expect(sunState.sunset.getTime()).to.be.below(curveEnd);
  });

  it('should end the curve at the next local midnight on the spring DST day', async () => {
    // 2026-03-29 in Paris: the clock jumps from 02:00 to 03:00, the day lasts 23 hours
    const sunState = await house.getSunState(parisHouse, new Date('2026-03-29T10:00:00.000Z'));
    const firstPoint = dayjs(sunState.curve[0].time).tz('Europe/Paris');
    const lastPoint = dayjs(sunState.curve[sunState.curve.length - 1].time).tz('Europe/Paris');

    expect(firstPoint.format('YYYY-MM-DD HH:mm')).to.equal('2026-03-29 00:00');
    // The curve must stop at the next local midnight, not one hour into the next day
    expect(lastPoint.format('YYYY-MM-DD HH:mm')).to.equal('2026-03-30 00:00');
    expect(sunState.sunrise.getTime()).to.be.above(sunState.curve[0].time.getTime());
    expect(sunState.sunset.getTime()).to.be.below(lastPoint.valueOf());
  });

  it('should end the curve at the next local midnight on the autumn DST day', async () => {
    // 2026-10-25 in Paris: the clock goes back from 03:00 to 02:00, the day lasts 25 hours
    const sunState = await house.getSunState(parisHouse, new Date('2026-10-25T10:00:00.000Z'));
    const firstPoint = dayjs(sunState.curve[0].time).tz('Europe/Paris');
    const lastPoint = dayjs(sunState.curve[sunState.curve.length - 1].time).tz('Europe/Paris');

    expect(firstPoint.format('YYYY-MM-DD HH:mm')).to.equal('2026-10-25 00:00');
    // The curve must reach the next local midnight, not stop one hour earlier
    expect(lastPoint.format('YYYY-MM-DD HH:mm')).to.equal('2026-10-26 00:00');
    expect(sunState.sunrise.getTime()).to.be.above(sunState.curve[0].time.getTime());
    expect(sunState.sunset.getTime()).to.be.below(lastPoint.valueOf());
  });

  it('should return null sun times during polar day', async () => {
    // Tromsø at the summer solstice: the sun never sets
    const tromsoHouse = { latitude: 69.6492, longitude: 18.9553 };
    const tromsoHouseInstance = buildHouse('Europe/Oslo');
    const sunState = await tromsoHouseInstance.getSunState(tromsoHouse, new Date('2026-06-21T12:00:00.000Z'));

    expect(sunState.sunrise).to.equal(null);
    expect(sunState.sunset).to.equal(null);
    expect(sunState.dawn).to.equal(null);
    expect(sunState.dusk).to.equal(null);
    // Solar noon always exists, and the sun stays above the horizon all day long
    expect(sunState.solar_noon).to.be.a('date');
    const minElevation = Math.min(...sunState.curve.map((point) => point.elevation));
    expect(minElevation).to.be.above(0);
  });

  it('should return null sun times during polar night', async () => {
    // Tromsø at the winter solstice: the sun never rises
    const tromsoHouse = { latitude: 69.6492, longitude: 18.9553 };
    const tromsoHouseInstance = buildHouse('Europe/Oslo');
    const sunState = await tromsoHouseInstance.getSunState(tromsoHouse, new Date('2026-12-21T12:00:00.000Z'));

    expect(sunState.sunrise).to.equal(null);
    expect(sunState.sunset).to.equal(null);
    const maxElevation = Math.max(...sunState.curve.map((point) => point.elevation));
    expect(maxElevation).to.be.below(0);
  });
});
