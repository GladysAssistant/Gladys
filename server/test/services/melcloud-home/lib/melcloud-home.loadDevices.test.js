const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const MELCloudHomeHandler = require('../../../../services/melcloud-home/lib');
const { MELCLOUD_HOME_API_ENDPOINT } = require('../../../../services/melcloud-home/lib/utils/melcloud-home.constants');

const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('MELCloudHomeHandler.loadDevices', () => {
  it('should load and flatten air-to-air units from buildings and guest buildings', async () => {
    const client = {
      get: fake.resolves({
        data: {
          buildings: [
            {
              id: 'building-1',
              airToAirUnits: [{ id: 'unit-1' }, { id: 'unit-2' }],
            },
          ],
          guestBuildings: [
            {
              id: 'building-2',
              airToAirUnits: [{ id: 'unit-3' }],
            },
          ],
        },
      }),
    };
    const handler = new MELCloudHomeHandler({}, serviceId, client);
    handler.getAccessToken = fake.resolves('access-token');

    const units = await handler.loadDevices();

    expect(units).to.deep.equal([
      { id: 'unit-1', buildingId: 'building-1' },
      { id: 'unit-2', buildingId: 'building-1' },
      { id: 'unit-3', buildingId: 'building-2' },
    ]);
    assert.calledWith(client.get, `${MELCLOUD_HOME_API_ENDPOINT}/context`, {
      headers: { Authorization: 'Bearer access-token' },
    });
  });

  it('should handle a context without buildings and a building without air-to-air units', async () => {
    const client = {
      get: fake.resolves({ data: { buildings: [{ id: 'building-1' }] } }),
    };
    const handler = new MELCloudHomeHandler({}, serviceId, client);
    handler.getAccessToken = fake.resolves('access-token');

    const units = await handler.loadDevices();

    expect(units).to.deep.equal([]);
  });

  it('should handle a context with only guest buildings', async () => {
    const client = {
      get: fake.resolves({ data: { guestBuildings: [{ id: 'guest-1', airToAirUnits: [{ id: 'unit-9' }] }] } }),
    };
    const handler = new MELCloudHomeHandler({}, serviceId, client);
    handler.getAccessToken = fake.resolves('access-token');

    const units = await handler.loadDevices();

    expect(units).to.deep.equal([{ id: 'unit-9', buildingId: 'guest-1' }]);
  });
});
