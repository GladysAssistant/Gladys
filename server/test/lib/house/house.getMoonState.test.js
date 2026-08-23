const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezonePlugin = require('dayjs/plugin/timezone');

const { fake } = sinon;

const House = require('../../../lib/house');
const {
  findNextZeroCrossing,
  findNextExtremum,
  findNextLunarEclipse,
} = require('../../../lib/house/house.getMoonState');

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

// Mean length of a lunation, used to bound the "next phase" searches
const SYNODIC_MONTH_DAYS = 29.530588853;

describe('house.getMoonState', () => {
  const house = buildHouse('Europe/Paris');
  const parisHouse = { latitude: 48.8566, longitude: 2.3522 };
  const summerNoon = new Date('2026-07-05T12:00:00.000Z');

  it('should return a phase, a phase name and an illumination', async () => {
    const moonState = await house.getMoonState(parisHouse, summerNoon);
    expect(moonState.phase).to.be.at.least(0);
    expect(moonState.phase).to.be.below(1);
    expect(moonState.phase_name).to.be.a('string');
    expect(moonState.illumination).to.be.at.least(0);
    expect(moonState.illumination).to.be.at.most(100);
  });

  it('should return the current position and distance of the moon', async () => {
    const moonState = await house.getMoonState(parisHouse, summerNoon);
    expect(moonState.azimuth).to.be.at.least(0);
    expect(moonState.azimuth).to.be.below(360);
    expect(moonState.elevation).to.be.at.least(-90);
    expect(moonState.elevation).to.be.at.most(90);
    // The moon orbit stays between roughly 356 000 and 407 000 km
    expect(moonState.distance).to.be.above(355000);
    expect(moonState.distance).to.be.below(408000);
  });

  it('should report a full moon as fully illuminated', async () => {
    // Full moon of 2026-08-28
    const moonState = await house.getMoonState(parisHouse, new Date('2026-08-28T04:19:00.000Z'));
    expect(moonState.phase_name).to.equal('fullMoon');
    expect(moonState.illumination).to.be.at.least(99);
  });

  it('should report a new moon as not illuminated', async () => {
    // New moon of 2026-09-11
    const moonState = await house.getMoonState(parisHouse, new Date('2026-09-11T03:27:00.000Z'));
    expect(moonState.phase_name).to.equal('newMoon');
    expect(moonState.illumination).to.be.at.most(1);
  });

  it('should report the moon as waxing before the full moon and waning after', async () => {
    const beforeFullMoon = await house.getMoonState(parisHouse, new Date('2026-08-25T12:00:00.000Z'));
    const afterFullMoon = await house.getMoonState(parisHouse, new Date('2026-09-01T12:00:00.000Z'));
    expect(beforeFullMoon.waxing).to.equal(true);
    expect(afterFullMoon.waxing).to.equal(false);
  });

  it('should return the age of the moon within a lunation', async () => {
    const moonState = await house.getMoonState(parisHouse, summerNoon);
    expect(moonState.age_days).to.be.at.least(0);
    expect(moonState.age_days).to.be.below(SYNODIC_MONTH_DAYS);
  });

  it('should return the four next phases, each within one lunation', async () => {
    const moonState = await house.getMoonState(parisHouse, summerNoon);
    const nextPhases = [
      moonState.next_new_moon,
      moonState.next_first_quarter,
      moonState.next_full_moon,
      moonState.next_last_quarter,
    ];
    nextPhases.forEach((date) => {
      expect(date).to.be.a('date');
      expect(date.getTime()).to.be.above(summerNoon.getTime());
      // Each phase happens once per lunation, so the next one is never further away
      expect(dayjs(date).diff(summerNoon, 'day', true)).to.be.below(SYNODIC_MONTH_DAYS + 1);
    });
    // The four phases are distinct moments of the same lunation
    const timestamps = nextPhases.map((date) => date.getTime());
    expect(new Set(timestamps).size).to.equal(4);
  });

  it('should find the next full moon close to the published one', async () => {
    // Published full moon: 2026-08-28 04:19 UTC. The simplified series used by
    // SunCalc is accurate to a few hours, which is enough for a dashboard.
    const moonState = await house.getMoonState(parisHouse, new Date('2026-08-23T12:00:00.000Z'));
    const hoursFromPublished = Math.abs(dayjs(moonState.next_full_moon).diff('2026-08-28T04:19:00.000Z', 'hour', true));
    expect(hoursFromPublished).to.be.below(6);
  });

  it('should return a perigee closer than the apogee', async () => {
    const moonState = await house.getMoonState(parisHouse, summerNoon);
    expect(moonState.next_perigee).to.be.a('date');
    expect(moonState.next_apogee).to.be.a('date');
    // Both happen once per anomalistic month, so within ~28 days
    expect(dayjs(moonState.next_perigee).diff(summerNoon, 'day')).to.be.below(29);
    expect(dayjs(moonState.next_apogee).diff(summerNoon, 'day')).to.be.below(29);
    // The two extremums are not interchangeable: the moon is closer at the
    // perigee than at the apogee.
    const perigeeState = await house.getMoonState(parisHouse, moonState.next_perigee);
    const apogeeState = await house.getMoonState(parisHouse, moonState.next_apogee);
    expect(perigeeState.distance).to.be.below(apogeeState.distance);
  });

  it('should return the next node with the direction the moon is heading to', async () => {
    const moonState = await house.getMoonState(parisHouse, summerNoon);
    expect(moonState.next_node).to.be.a('date');
    // A node is crossed twice per draconic month, so within ~28 days
    expect(dayjs(moonState.next_node).diff(summerNoon, 'day')).to.be.below(29);
  });

  it('should head to the descending node while north of the ecliptic and still climbing', async () => {
    // The moon keeps climbing for about a week after it has crossed the
    // ascending node, so its current direction says nothing about the node it
    // is heading to: north of the ecliptic, the next one is always descending.
    const moonState = await house.getMoonState(parisHouse, new Date('2026-08-28T12:00:00.000Z'));
    expect(moonState.ascending).to.equal(true);
    expect(moonState.next_node_ascending).to.equal(false);
  });

  it('should head to the ascending node while south of the ecliptic and still falling', async () => {
    const moonState = await house.getMoonState(parisHouse, new Date('2026-09-10T12:00:00.000Z'));
    expect(moonState.ascending).to.equal(false);
    expect(moonState.next_node_ascending).to.equal(true);
  });

  it('should return a zodiac sign', async () => {
    const moonState = await house.getMoonState(parisHouse, summerNoon);
    expect(moonState.zodiac_sign).to.be.a('string');
    expect(moonState.zodiac_sign).to.not.equal(undefined);
  });

  it('should name the constellation on the sidereal zodiac', async () => {
    // Midnight in Paris on 2026-08-23, as published by lunar calendars: the
    // moon is in Sagittarius. On the tropical zodiac it would be Capricorn,
    // a full sign away, because of precession.
    const moonState = await house.getMoonState(parisHouse, new Date('2026-08-22T22:00:00.000Z'));
    expect(moonState.zodiac_sign).to.equal('sagittarius');
  });

  it('should return a distance matching the published ephemerides', async () => {
    // Published distance at midnight in Paris on 2026-08-23: 404 453 km.
    // Only the first term of the series would be off by around 1400 km.
    const moonState = await house.getMoonState(parisHouse, new Date('2026-08-22T22:00:00.000Z'));
    expect(Math.abs(moonState.distance - 404453)).to.be.below(300);
  });

  it('should measure the age from the real last new moon', async () => {
    // Published age at midnight in Paris on 2026-08-23: 10 days 4 hours.
    // Deriving the age from the phase alone assumes a mean lunation and is
    // off by several hours.
    const moonState = await house.getMoonState(parisHouse, new Date('2026-08-22T22:00:00.000Z'));
    expect(Math.abs(moonState.age_days - 10.2)).to.be.below(0.5);
  });

  it('should keep the age consistent with the last new moon it reports', async () => {
    // Just after a new moon the age restarts from zero
    const justAfterNewMoon = await house.getMoonState(parisHouse, new Date('2026-09-11T06:00:00.000Z'));
    expect(justAfterNewMoon.age_days).to.be.below(1);
    // Just before the next one it is close to a full lunation
    const justBeforeNewMoon = await house.getMoonState(parisHouse, new Date('2026-10-09T00:00:00.000Z'));
    expect(justBeforeNewMoon.age_days).to.be.above(27);
  });

  it('should find the next lunar eclipse on a full moon', async () => {
    const moonState = await house.getMoonState(parisHouse, new Date('2026-01-15T00:00:00.000Z'));
    expect(moonState.next_eclipse).to.be.a('date');
    expect(moonState.next_eclipse_type).to.be.oneOf(['penumbral', 'partialOrTotal']);
    // A lunar eclipse can only happen at the full moon, so the illumination
    // of the moon on that date must be nearly complete.
    const atEclipse = await house.getMoonState(parisHouse, moonState.next_eclipse);
    expect(atEclipse.illumination).to.be.at.least(97);
  });

  it('should return moonrise and moonset of the local day', async () => {
    const moonState = await house.getMoonState(parisHouse, new Date('2026-08-23T12:00:00.000Z'));
    // On that day the moon both rises and sets in Paris
    expect(moonState.moonrise).to.be.a('date');
    expect(moonState.moonset).to.be.a('date');
    const localDay = dayjs(new Date('2026-08-23T12:00:00.000Z'))
      .tz('Europe/Paris')
      .format('YYYY-MM-DD');
    expect(
      dayjs(moonState.moonrise)
        .tz('Europe/Paris')
        .format('YYYY-MM-DD'),
    ).to.equal(localDay);
    expect(
      dayjs(moonState.moonset)
        .tz('Europe/Paris')
        .format('YYYY-MM-DD'),
    ).to.equal(localDay);
  });

  it('should compute the moon times on the local day of the configured timezone', async () => {
    const tokyoHouse = { latitude: 35.6762, longitude: 139.6503 };
    const tokyoHouseInstance = buildHouse('Asia/Tokyo');
    // 15:00 in Tokyo, so the local day is not the UTC day
    const tokyoAfternoon = new Date('2026-07-05T06:00:00.000Z');
    const moonState = await tokyoHouseInstance.getMoonState(tokyoHouse, tokyoAfternoon);
    const localDay = dayjs(tokyoAfternoon)
      .tz('Asia/Tokyo')
      .format('YYYY-MM-DD');
    if (moonState.moonrise) {
      expect(
        dayjs(moonState.moonrise)
          .tz('Asia/Tokyo')
          .format('YYYY-MM-DD'),
      ).to.equal(localDay);
    }
    if (moonState.moonset) {
      expect(
        dayjs(moonState.moonset)
          .tz('Asia/Tokyo')
          .format('YYYY-MM-DD'),
      ).to.equal(localDay);
    }
  });

  it('should default to Europe/Paris when no timezone is configured', async () => {
    const houseWithoutTimezone = buildHouse(null);
    const moonState = await houseWithoutTimezone.getMoonState(parisHouse, new Date('2026-08-23T12:00:00.000Z'));
    expect(moonState.moonrise).to.be.a('date');
    expect(
      dayjs(moonState.moonrise)
        .tz('Europe/Paris')
        .format('YYYY-MM-DD'),
    ).to.equal('2026-08-23');
  });

  it('should return a null moon time when the moon does not cross the horizon', async () => {
    // Far enough north, the moon can stay below or above the horizon all day
    const tromsoHouse = { latitude: 69.6492, longitude: 18.9553 };
    const tromsoHouseInstance = buildHouse('Europe/Oslo');
    // Scan a full lunation: at this latitude at least one such day always happens
    let foundNullTime = false;
    for (let day = 0; day < 30 && !foundNullTime; day += 1) {
      const date = new Date(Date.UTC(2026, 6, 1 + day, 12));
      // eslint-disable-next-line no-await-in-loop
      const moonState = await tromsoHouseInstance.getMoonState(tromsoHouse, date);
      if (moonState.moonrise === null || moonState.moonset === null) {
        foundNullTime = true;
      }
    }
    expect(foundNullTime).to.equal(true);
  });

  it('should compute the values at local midnight when asked to', async () => {
    // 23:00 in Paris: the values of the moment differ from those of midnight
    const evening = new Date('2026-08-23T21:00:00.000Z');
    const live = await house.getMoonState(parisHouse, evening);
    const atMidnight = await house.getMoonState(parisHouse, evening, { atMidnight: true });
    // Over those 23 hours the moon gains illumination and gets closer
    expect(live.illumination).to.be.above(atMidnight.illumination);
    expect(live.distance).to.be.below(atMidnight.distance);
    expect(live.age_days).to.be.above(atMidnight.age_days);
    // The midnight values are the ones lunar calendars publish for that day
    expect(atMidnight.illumination).to.equal(75);
    expect(Math.abs(atMidnight.distance - 404453)).to.be.below(300);
  });

  it('should give the same midnight values whatever time of the day it is asked', async () => {
    // A lunar calendar publishes one set of values per day: asking at 06:00 or
    // at 23:00 must return exactly the same numbers.
    const morning = await house.getMoonState(parisHouse, new Date('2026-08-23T04:00:00.000Z'), {
      atMidnight: true,
    });
    const evening = await house.getMoonState(parisHouse, new Date('2026-08-23T21:00:00.000Z'), {
      atMidnight: true,
    });
    expect(morning.illumination).to.equal(evening.illumination);
    expect(morning.distance).to.equal(evening.distance);
    expect(morning.age_days).to.equal(evening.age_days);
    expect(morning.zodiac_sign).to.equal(evening.zodiac_sign);
    expect(morning.next_full_moon.getTime()).to.equal(evening.next_full_moon.getTime());
  });

  it('should keep the moon times of the local day when computing at midnight', async () => {
    // Moonrise and moonset belong to the day, not to the instant: they must
    // not change when the values are computed at midnight.
    const evening = new Date('2026-08-23T21:00:00.000Z');
    const live = await house.getMoonState(parisHouse, evening);
    const atMidnight = await house.getMoonState(parisHouse, evening, { atMidnight: true });
    expect(atMidnight.moonrise.getTime()).to.equal(live.moonrise.getTime());
    expect(atMidnight.moonset.getTime()).to.equal(live.moonset.getTime());
  });

  it('should compute at midnight of the local timezone, not of the server', async () => {
    const tokyoHouse = { latitude: 35.6762, longitude: 139.6503 };
    const tokyoHouseInstance = buildHouse('Asia/Tokyo');
    // 15:00 in Tokyo on 2026-07-05, so local midnight is 2026-07-04T15:00Z
    const tokyoAfternoon = new Date('2026-07-05T06:00:00.000Z');
    const atMidnight = await tokyoHouseInstance.getMoonState(tokyoHouse, tokyoAfternoon, {
      atMidnight: true,
    });
    const atTokyoMidnight = await tokyoHouseInstance.getMoonState(tokyoHouse, new Date('2026-07-04T15:00:00.000Z'));
    expect(atMidnight.illumination).to.equal(atTokyoMidnight.illumination);
    expect(atMidnight.distance).to.equal(atTokyoMidnight.distance);
  });

  it('should keep the current time by default', async () => {
    const evening = new Date('2026-08-23T21:00:00.000Z');
    const byDefault = await house.getMoonState(parisHouse, evening);
    const explicitLive = await house.getMoonState(parisHouse, evening, { atMidnight: false });
    expect(byDefault.illumination).to.equal(explicitLive.illumination);
    expect(byDefault.distance).to.equal(explicitLive.distance);
  });

  it('should keep the phase consistent across a whole lunation', async () => {
    // Walking through a lunation, the illumination must grow up to the full
    // moon and shrink afterwards, and the phase name must follow.
    const start = new Date('2026-08-13T00:00:00.000Z');
    const states = [];
    for (let day = 0; day < 30; day += 1) {
      const date = new Date(start.getTime() + day * 24 * 60 * 60 * 1000);
      // eslint-disable-next-line no-await-in-loop
      states.push(await house.getMoonState(parisHouse, date));
    }
    states.forEach((moonState) => {
      // The illuminated fraction always matches the phase it is named after
      if (moonState.phase_name === 'fullMoon') {
        expect(moonState.illumination).to.be.at.least(96);
      }
      if (moonState.phase_name === 'newMoon') {
        expect(moonState.illumination).to.be.at.most(4);
      }
      if (moonState.phase_name === 'firstQuarter' || moonState.phase_name === 'lastQuarter') {
        expect(moonState.illumination).to.be.within(40, 60);
      }
      // The moon is waxing exactly on the first half of the lunation
      expect(moonState.waxing).to.equal(moonState.phase < 0.5);
    });
  });

  describe('search helpers', () => {
    it('should return null when no zero crossing happens in the window', async () => {
      // A function that never changes sign has no crossing to find
      const alwaysPositive = () => 1;
      expect(findNextZeroCrossing(new Date('2026-08-23T00:00:00.000Z'), alwaysPositive, 10, 6)).to.equal(null);
    });

    it('should return null when no extremum happens in the window', async () => {
      // A strictly increasing function has no local minimum
      const strictlyIncreasing = (date) => date.getTime();
      expect(findNextExtremum(new Date('2026-08-23T00:00:00.000Z'), strictlyIncreasing, true, 10)).to.equal(null);
    });

    it('should return null when no eclipse is found in the scanned lunations', async () => {
      // Searching from an invalid date makes every phase search fail
      expect(findNextLunarEclipse(new Date(NaN))).to.equal(null);
    });

    it('should give up when the scanned window holds no eclipse', async () => {
      // Eclipses come in seasons: a single lunation after this date holds none,
      // while the default window always ends up finding one.
      const from = new Date('2026-03-10T00:00:00.000Z');
      expect(findNextLunarEclipse(from, 1)).to.equal(null);
      expect(findNextLunarEclipse(from)).to.not.equal(null);
    });
  });
});
