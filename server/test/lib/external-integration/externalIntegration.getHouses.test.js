const { expect } = require('chai');

const { ForbiddenError } = require('../../../utils/coreErrors');
const { buildSupervisor, TEST_MANIFEST } = require('./testUtils.test');

describe('externalIntegration.getHouses', () => {
  let externalIntegration;

  beforeEach(() => {
    ({ externalIntegration } = buildSupervisor());
  });

  const expectForbidden = async (service) => {
    try {
      await externalIntegration.getHouses(service);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(ForbiddenError);
      expect(e.message).to.include('location');
    }
  };

  it('should return the houses sorted by name, with only the location fields', async () => {
    const houses = await externalIntegration.getHouses({ manifest: { ...TEST_MANIFEST, location: true } });
    // the seeded houses, name ascending; "Peppers house" has no coordinates
    // yet — an integration must handle null, not assume a located house
    expect(houses).to.deep.equal([
      {
        id: '6295ad8b-b655-4422-9e6d-b4612da5d55f',
        name: 'Peppers house',
        selector: 'pepper-house',
        latitude: null,
        longitude: null,
      },
      {
        id: 'a741dfa6-24de-4b46-afc7-370772f068d5',
        name: 'Test house',
        selector: 'test-house',
        latitude: 12,
        longitude: 12,
      },
    ]);
    // the alarm columns of t_house never leave the core
    houses.forEach((house) => {
      expect(house).to.have.all.keys('id', 'name', 'selector', 'latitude', 'longitude');
    });
  });

  it('should refuse an integration not declaring the location access', async () => {
    await expectForbidden({ manifest: TEST_MANIFEST });
  });

  it('should refuse an integration declaring location false', async () => {
    await expectForbidden({ manifest: { ...TEST_MANIFEST, location: false } });
  });

  it('should refuse an integration without any manifest', async () => {
    await expectForbidden({});
  });

  it('should refuse a truthy but non-boolean location declaration', async () => {
    // validateManifest rejects it at install, but the gate is the last line
    // of defense: only an explicit true opens the coordinates
    await expectForbidden({ manifest: { ...TEST_MANIFEST, location: 'true' } });
  });
});
