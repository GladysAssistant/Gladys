const { expect } = require('chai');
const { DASHBOARD_TYPE, DASHBOARD_VISIBILITY } = require('../../../utils/constants');

const Dashboard = require('../../../lib/dashboard');

describe('dashboard.get', () => {
  const dashboard = new Dashboard();
  beforeEach(async () => {
    // Create a public and a private dashboard
    await dashboard.create('7a137a56-069e-4996-8816-36558174b727', {
      id: '84fa1408-e6a2-42b2-93bd-c176d17d7d56',
      name: 'My new public dashboard',
      selector: 'my-new-public-dashoard',
      type: DASHBOARD_TYPE.MAIN,
      visibility: DASHBOARD_VISIBILITY.PUBLIC,
      position: 2,
      boxes: [[]],
      updated_at: '2024-05-13 14:23:50.038 +00:00',
    });
    await dashboard.create('7a137a56-069e-4996-8816-36558174b727', {
      name: 'My new private dashboard',
      selector: 'another-private-dashoard',
      type: DASHBOARD_TYPE.MAIN,
      visibility: DASHBOARD_VISIBILITY.PRIVATE,
      position: 3,
      boxes: [[]],
    });
  });
  it('should return list of dashboard', async () => {
    const dashboards = await dashboard.get('0cd30aef-9c4e-4a23-88e3-3547971296e5');
    expect(dashboards).to.deep.equal([
      {
        id: '854dda11-80c0-4476-843b-65cbc95c6a85',
        name: 'Test dashboard',
        selector: 'test-dashboard',
        type: 'main',
        updated_at: '2019-02-12 07:49:07.556 +00:00',
      },
      {
        id: '84fa1408-e6a2-42b2-93bd-c176d17d7d56',
        name: 'My new public dashboard',
        selector: 'my-new-public-dashoard',
        type: 'main',
        updated_at: dashboards[1].updated_at,
      },
    ]);
  });
});
