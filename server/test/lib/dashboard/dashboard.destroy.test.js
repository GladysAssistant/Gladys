const { assert } = require('chai');
const { DASHBOARD_BOX_TYPE, DASHBOARD_TYPE, DASHBOARD_VISIBILITY } = require('../../../utils/constants');

const Dashboard = require('../../../lib/dashboard');

describe('dashboard.destroy', () => {
  const dashboard = new Dashboard();
  it('should destroy a dashoard', async () => {
    await dashboard.destroy('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'test-dashboard');
  });
  it('should destroy a public dashoard', async () => {
    const publicDashboard = await dashboard.create('7a137a56-069e-4996-8816-36558174b727', {
      name: 'My new public dashboard',
      selector: 'my-new-public-dashoard',
      type: DASHBOARD_TYPE.MAIN,
      visibility: DASHBOARD_VISIBILITY.PUBLIC,
      position: 0,
      boxes: [
        [
          {
            type: DASHBOARD_BOX_TYPE.USER_PRESENCE,
          },
        ],
      ],
    });
    await dashboard.destroy('0cd30aef-9c4e-4a23-88e3-3547971296e5', publicDashboard.selector);
  });
  it('should return not found', async () => {
    const promise = dashboard.destroy('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'not-found-dashboard');
    return assert.isRejected(promise, 'Dashboard not found');
  });
});
