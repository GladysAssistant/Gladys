const { expect } = require('chai');

const db = require('../../models');

const migration = require('../../migrations/20260828100000-wrap-house-longitude');

const createHouse = (name, latitude, longitude) =>
  db.House.create({
    name,
    selector: name,
    latitude,
    longitude,
  });

const getHouse = (name) => db.House.findOne({ where: { name } });

describe('migration 20260828100000-wrap-house-longitude', () => {
  it('should wrap a longitude saved past the antimeridian', async () => {
    await createHouse('oregon', 45.2330178646654, 236.031002998352);

    await migration.up();

    const house = await getHouse('oregon');
    expect(house.longitude).to.equal(-123.968997001648);
    // The latitude is never wrapped, just like Leaflet's LatLng.wrap()
    expect(house.latitude).to.equal(45.2330178646654);
  });

  it('should wrap a longitude saved west of the antimeridian', async () => {
    await createHouse('west', 10, -543.5);

    await migration.up();

    const house = await getHouse('west');
    expect(house.longitude).to.equal(176.5);
  });

  it('should leave an in-range longitude untouched', async () => {
    await createHouse('paris', 48.8583, 2.2945);
    await createHouse('antimeridian', 0, 180);

    await migration.up();

    const paris = await getHouse('paris');
    expect(paris.longitude).to.equal(2.2945);
    const antimeridian = await getHouse('antimeridian');
    expect(antimeridian.longitude).to.equal(180);
  });

  it('should leave a house without location untouched', async () => {
    await createHouse('no-location', null, null);

    await migration.up();

    const house = await getHouse('no-location');
    expect(house.latitude).to.equal(null);
    expect(house.longitude).to.equal(null);
  });

  it('should be idempotent', async () => {
    await createHouse('oregon', 45.2330178646654, 236.031002998352);

    await migration.up();
    await migration.up();

    const house = await getHouse('oregon');
    expect(house.longitude).to.equal(-123.968997001648);
  });

  it('should have an empty down migration', async () => {
    await migration.down();
  });
});
