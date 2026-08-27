const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const axios = require('axios');

const { fake } = sinon;

const House = require('../../../lib/house');
const {
  distanceInKm,
  getChartDatumOffset,
  computeTideCoefficient,
  loadTidePredictor,
} = require('../../../lib/house/house.getTideState');

// Real harmonics of Saint-Malo, from the TICON-4 dataset the tide database is
// built on. Using the real ones keeps the assertions checkable against the
// tide tables published by the SHOM.
const SAINT_MALO_STATION = {
  id: 'ticon/saint_malo-410-fra-refmar',
  name: 'Saint Malo',
  country: 'France',
  latitude: 48.640812,
  longitude: -2.028103,
  timezone: 'Europe/Paris',
  chart_datum: 'LAT',
  datums: { MSL: 6.81, LAT: 0.06, MHWS: 11.918, MLWS: 1.702 },
  source: 'TICON-4',
  license: 'cc-by-4.0',
  harmonic_constituents: [
    { name: 'M2', amplitude: 3.67369853, phase: 177.533856 },
    { name: 'N2', amplitude: 0.71660512, phase: 161.365553 },
    { name: 'S2', amplitude: 1.43439656, phase: 227.909724 },
    { name: 'K2', amplitude: 0.41031045, phase: 225.407325 },
    { name: 'K1', amplitude: 0.06955, phase: 108.0 },
    { name: 'O1', amplitude: 0.09, phase: 320.0 },
  ],
};

// A Mediterranean-like station: a real one nearby, but the sea barely moves.
const NICE_STATION = {
  id: 'ticon/nice',
  name: 'Nice',
  country: 'France',
  latitude: 43.6952,
  longitude: 7.2861,
  timezone: 'Europe/Paris',
  chart_datum: 'LAT',
  datums: { MSL: 0.3, LAT: 0.0, MHWS: 0.41, MLWS: 0.2 },
  harmonic_constituents: [
    { name: 'M2', amplitude: 0.0567, phase: 322.0 },
    { name: 'S2', amplitude: 0.0234, phase: 337.0 },
  ],
};

const event = { emit: fake.returns(null) };

const buildHouse = (storedStation) => {
  const store = {};
  if (storedStation) {
    store[`TIDE_STATION_${storedStation.selector}`] = JSON.stringify({
      station: storedStation.station,
      house_latitude: storedStation.latitude,
      house_longitude: storedStation.longitude,
      downloaded_at: new Date().toISOString(),
    });
  }
  const variable = {
    getValue: (key) => {
      if (key === 'TIMEZONE') {
        return Promise.resolve('Europe/Paris');
      }
      return Promise.resolve(store[key] || null);
    },
    setValue: (key, value) => {
      store[key] = value;
      return Promise.resolve(null);
    },
  };
  return new House(event, {}, {}, variable);
};

describe('house.getTideState', () => {
  afterEach(() => {
    sinon.restore();
  });

  const saintMaloHouse = { selector: 'saint-malo', latitude: 48.649, longitude: -2.026 };
  // A moment in the middle of the tide cycle, so both a high and a low tide follow
  const now = new Date('2026-08-27T10:00:00.000Z');

  it('should return the tides of a house by the sea', async () => {
    const house = buildHouse({
      selector: 'SAINT_MALO',
      station: SAINT_MALO_STATION,
      latitude: saintMaloHouse.latitude,
      longitude: saintMaloHouse.longitude,
    });
    const tideState = await house.getTideState(saintMaloHouse, now);

    expect(tideState.available).to.equal(true);
    expect(tideState.station_name).to.equal('Saint Malo');
    expect(tideState.next_high_tide.high).to.equal(true);
    expect(tideState.next_low_tide.high).to.equal(false);
    // Saint-Malo has one of the largest tidal ranges in the world
    expect(tideState.tide_range).to.be.above(8);
  });

  it('should count heights from the chart datum, like a tide table', async () => {
    const house = buildHouse({
      selector: 'SAINT_MALO',
      station: SAINT_MALO_STATION,
      latitude: saintMaloHouse.latitude,
      longitude: saintMaloHouse.longitude,
    });
    const tideState = await house.getTideState(saintMaloHouse, now);
    // Published high tides in Saint-Malo sit around 10-12 m above the chart
    // datum, never around 4 m, which is what the raw prediction returns.
    expect(tideState.next_high_tide.height).to.be.above(9);
    expect(tideState.next_high_tide.height).to.be.below(13);
    expect(tideState.next_low_tide.height).to.be.above(0);
  });

  it('should say the sea is rising or falling', async () => {
    const house = buildHouse({
      selector: 'SAINT_MALO',
      station: SAINT_MALO_STATION,
      latitude: saintMaloHouse.latitude,
      longitude: saintMaloHouse.longitude,
    });
    const tideState = await house.getTideState(saintMaloHouse, now);
    // The next extreme decides the direction: rising towards a high tide
    const nextTide = [tideState.next_high_tide, tideState.next_low_tide].sort(
      (a, b) => new Date(a.time) - new Date(b.time),
    )[0];
    expect(tideState.rising).to.equal(nextTide.high);
  });

  it('should return a tide curve covering the local day', async () => {
    const house = buildHouse({
      selector: 'SAINT_MALO',
      station: SAINT_MALO_STATION,
      latitude: saintMaloHouse.latitude,
      longitude: saintMaloHouse.longitude,
    });
    const tideState = await house.getTideState(saintMaloHouse, now);
    expect(tideState.curve).to.be.an('array');
    // One point every 10 minutes over 24 hours, plus the closing point
    expect(tideState.curve.length).to.equal(145);
    tideState.curve.forEach((point) => {
      expect(point).to.have.property('time');
      expect(point).to.have.property('height');
    });
  });

  it('should return the tides of the day, each high tide with its coefficient', async () => {
    const house = buildHouse({
      selector: 'SAINT_MALO',
      station: SAINT_MALO_STATION,
      latitude: saintMaloHouse.latitude,
      longitude: saintMaloHouse.longitude,
    });
    const tideState = await house.getTideState(saintMaloHouse, now);

    expect(tideState.day_tides).to.be.an('array');
    // Saint-Malo has a semi-diurnal tide: four extremes on a normal day
    expect(tideState.day_tides.length).to.be.within(3, 5);
    tideState.day_tides.forEach((tide) => {
      expect(tide).to.have.property('time');
      expect(tide).to.have.property('height');
      // A coefficient is published per high tide, never for a low one
      if (tide.high) {
        expect(tide.coefficient).to.be.at.least(20);
        expect(tide.coefficient).to.be.at.most(120);
      } else {
        expect(tide.coefficient).to.equal(null);
      }
    });
    // They are the tides of the drawn day, in chronological order
    const times = tideState.day_tides.map((tide) => new Date(tide.time).getTime());
    expect(times).to.deep.equal([...times].sort((a, b) => a - b));
  });

  it('should not return a tide coefficient outside the French coast', async () => {
    const sanFranciscoHouse = { selector: 'sf', latitude: 37.8083, longitude: -122.4156 };
    const station = {
      ...SAINT_MALO_STATION,
      name: 'San Francisco',
      country: 'United States',
      latitude: 37.8067,
      longitude: -122.4659,
      timezone: 'America/Los_Angeles',
    };
    const house = buildHouse({
      selector: 'SF',
      station,
      latitude: sanFranciscoHouse.latitude,
      longitude: sanFranciscoHouse.longitude,
    });
    const tideState = await house.getTideState(sanFranciscoHouse, now);
    // The coefficient is a Brest-referenced French number: it means nothing here
    expect(tideState.coefficient).to.equal(null);
    tideState.day_tides.forEach((tide) => {
      expect(tide.coefficient).to.equal(null);
    });
  });

  it('should draw another day of the week when asked to', async () => {
    const house = buildHouse({
      selector: 'SAINT_MALO',
      station: SAINT_MALO_STATION,
      latitude: saintMaloHouse.latitude,
      longitude: saintMaloHouse.longitude,
    });
    const today = await house.getTideState(saintMaloHouse, now, { dayOffset: 0 });
    const inThreeDays = await house.getTideState(saintMaloHouse, now, { dayOffset: 3 });

    expect(inThreeDays.day_offset).to.equal(3);
    // Whatever the day, the widget gets one day of curve: the day is stepped
    // through, never piled up.
    expect(inThreeDays.curve.length).to.equal(today.curve.length);
    const daysApart = (new Date(inThreeDays.day).getTime() - new Date(today.day).getTime()) / (24 * 60 * 60 * 1000);
    expect(Math.round(daysApart)).to.equal(3);
    // And it is a different day, with its own tides
    expect(new Date(inThreeDays.day_tides[0].time).getTime()).to.be.above(new Date(today.day_tides[0].time).getTime());
  });

  it('should keep the requested day inside the forecast range', async () => {
    const house = buildHouse({
      selector: 'SAINT_MALO',
      station: SAINT_MALO_STATION,
      latitude: saintMaloHouse.latitude,
      longitude: saintMaloHouse.longitude,
    });
    // Out-of-range values are clamped rather than rejected: the widget must not
    // break on a hand-edited request.
    const before = await house.getTideState(saintMaloHouse, now, { dayOffset: -5 });
    expect(before.day_offset).to.equal(0);
    const after = await house.getTideState(saintMaloHouse, now, { dayOffset: 99 });
    expect(after.day_offset).to.equal(6);
  });

  it('should report no tide when the house is inland', async () => {
    const house = buildHouse({
      // The database answers with the closest harbour, which is 150 km away
      selector: 'PARIS',
      station: SAINT_MALO_STATION,
      latitude: 48.8566,
      longitude: 2.3522,
    });
    const tideState = await house.getTideState({ selector: 'paris', latitude: 48.8566, longitude: 2.3522 }, now);
    expect(tideState.available).to.equal(false);
    expect(tideState.reason).to.equal('no_station_nearby');
    expect(tideState.nearest_station_distance).to.be.above(80);
  });

  it('should report no tide on a sea whose range is negligible', async () => {
    const niceHouse = { selector: 'nice', latitude: 43.7102, longitude: 7.262 };
    const house = buildHouse({
      selector: 'NICE',
      station: NICE_STATION,
      latitude: niceHouse.latitude,
      longitude: niceHouse.longitude,
    });
    const tideState = await house.getTideState(niceHouse, now);
    expect(tideState.available).to.equal(false);
    expect(tideState.reason).to.equal('negligible_tide');
    expect(tideState.station_name).to.equal('Nice');
    expect(tideState.tide_range).to.be.below(0.5);
  });

  it('should download the station the first time, then reuse it', async () => {
    const get = sinon.stub(axios, 'get').resolves({ data: [SAINT_MALO_STATION] });
    const house = buildHouse(null);

    const first = await house.getTideState(saintMaloHouse, now);
    expect(first.available).to.equal(true);
    expect(get.callCount).to.equal(1);

    // The constituents are stored: no second call, so tides keep being
    // predicted even with no network access.
    const second = await house.getTideState(saintMaloHouse, now);
    expect(second.available).to.equal(true);
    expect(get.callCount).to.equal(1);
  });

  it('should keep working offline once the station is known', async () => {
    sinon.stub(axios, 'get').rejects(new Error('getaddrinfo ENOTFOUND'));
    const house = buildHouse({
      selector: 'SAINT_MALO',
      station: SAINT_MALO_STATION,
      latitude: saintMaloHouse.latitude,
      longitude: saintMaloHouse.longitude,
    });
    const tideState = await house.getTideState(saintMaloHouse, now);
    expect(tideState.available).to.equal(true);
  });

  it('should tell a failed download apart from a house away from the sea', async () => {
    // Saint Malo is on the coast: saying it is inland because the database is
    // unreachable would be plainly wrong.
    sinon.stub(axios, 'get').rejects(new Error('getaddrinfo ENOTFOUND'));
    const house = buildHouse(null);
    const tideState = await house.getTideState(saintMaloHouse, now);
    expect(tideState.available).to.equal(false);
    expect(tideState.reason).to.equal('station_unavailable');
  });

  it('should report no tide when the database has no station to give', async () => {
    sinon.stub(axios, 'get').resolves({ data: [] });
    const house = buildHouse(null);
    const tideState = await house.getTideState(saintMaloHouse, now);
    expect(tideState.available).to.equal(false);
    expect(tideState.reason).to.equal('no_station_nearby');
  });
});

describe('house.getTideState helpers', () => {
  it('should compute the distance between two points', () => {
    // Brest to Saint-Malo, about 175 km apart
    const distance = distanceInKm(48.3828, -4.4947, 48.6408, -2.0281);
    expect(distance).to.be.above(160);
    expect(distance).to.be.below(200);
  });

  it('should return the chart datum offset of a station', () => {
    expect(getChartDatumOffset(SAINT_MALO_STATION)).to.be.closeTo(6.75, 0.01);
  });

  it('should return a zero offset when the station publishes no datum', () => {
    expect(getChartDatumOffset({ name: 'Somewhere' })).to.equal(0);
  });

  it('should compute the tide coefficients published by the SHOM', async () => {
    const createTidePredictor = await loadTidePredictor();
    // Coefficients published for Brest in 2026. The coefficient is the same for
    // the whole Atlantic and Channel coast, so these are the reference values.
    const published = [
      ['2026-08-27T05:30:00+02:00', 74],
      ['2026-08-27T17:45:00+02:00', 78],
      ['2026-08-28T06:04:00+02:00', 83],
      ['2026-08-28T18:18:00+02:00', 86],
      ['2026-08-14T12:00:00+02:00', 102],
    ];
    published.forEach(([time, expected]) => {
      const coefficient = computeTideCoefficient(createTidePredictor, new Date(time));
      expect(coefficient).to.be.closeTo(expected, 2);
    });
  });

  it('should keep the coefficient inside the official 20-120 scale', async () => {
    const createTidePredictor = await loadTidePredictor();
    const dates = ['2026-01-15T00:00:00Z', '2026-03-21T00:00:00Z', '2026-06-10T00:00:00Z', '2026-11-02T00:00:00Z'];
    dates.forEach((date) => {
      const coefficient = computeTideCoefficient(createTidePredictor, new Date(date));
      expect(coefficient).to.be.at.least(20);
      expect(coefficient).to.be.at.most(120);
    });
  });
});
