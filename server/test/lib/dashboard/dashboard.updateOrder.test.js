const { expect } = require('chai');
const { DASHBOARD_BOX_TYPE, DASHBOARD_TYPE, DASHBOARD_VISIBILITY } = require('../../../utils/constants');

const Dashboard = require('../../../lib/dashboard');
const db = require('../../../models');

describe('dashboard.updateOrder', () => {
  const dashboard = new Dashboard();
  it('should update the order of dashboards', async () => {
    const newDashboard = await dashboard.create('0cd30aef-9c4e-4a23-88e3-3547971296e5', {
      name: 'My new dashboard',
      type: DASHBOARD_TYPE.MAIN,
      visibility: DASHBOARD_VISIBILITY.PRIVATE,
      position: 0,
      boxes: [
        [
          {
            type: DASHBOARD_BOX_TYPE.USER_PRESENCE,
          },
        ],
      ],
    });
    const publicDashboard = await dashboard.create('7a137a56-069e-4996-8816-36558174b727', {
      name: 'My new public dashboard',
      selector: 'my-new-public-dashoard',
      type: DASHBOARD_TYPE.MAIN,
      visibility: DASHBOARD_VISIBILITY.PUBLIC,
      position: 0,
      boxes: [[]],
    });
    await dashboard.updateOrder('0cd30aef-9c4e-4a23-88e3-3547971296e5', [
      newDashboard.selector,
      'test-dashboard',
      publicDashboard.selector,
    ]);
    const dashboardsInNewOrder = await db.Dashboard.findAll({
      attributes: ['selector', 'position'],
      order: [['position', 'asc']],
      raw: true,
    });
    expect(dashboardsInNewOrder).to.deep.equal([
      { selector: 'my-new-dashboard', position: 0 },
      { selector: 'test-dashboard', position: 1 },
      { selector: 'my-new-public-dashoard', position: 2 },
    ]);
  });
});
