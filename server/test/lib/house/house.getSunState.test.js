const { expect } = require('chai');
const sinon = require('sinon');

const { fake } = sinon;

const House = require('../../../lib/house');

const event = {
  emit: fake.returns(null),
};

describe('house.getSunState', () => {
  const house = new House(event);
  const parisHouse = { latitude: 48.8566, longitude: 2.3522 };
  // Midday UTC on a summer day, the sun is up in Paris
  const summerNoon = new Date('2026-07-05T12:00:00.000Z');

  it('should return sun times in chronological order', () => {
    const sunState = house.getSunState(parisHouse, summerNoon);
    expect(sunState.dawn.getTime()).to.be.below(sunState.sunrise.getTime());
    expect(sunState.sunrise.getTime()).to.be.below(sunState.solar_noon.getTime());
    expect(sunState.solar_noon.getTime()).to.be.below(sunState.sunset.getTime());
    expect(sunState.sunset.getTime()).to.be.below(sunState.dusk.getTime());
  });

  it('should return current azimuth and elevation in degrees', () => {
    const sunState = house.getSunState(parisHouse, summerNoon);
    expect(sunState.azimuth).to.be.a('number');
    expect(sunState.azimuth).to.be.at.least(0);
    expect(sunState.azimuth).to.be.below(360);
    // The sun is high in the sky at midday in July in Paris
    expect(sunState.elevation).to.be.above(45);
  });

  it('should return a full day elevation curve', () => {
    const sunState = house.getSunState(parisHouse, summerNoon);
    // One point every 20 minutes from 00:00 to 24:00 included
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
});
