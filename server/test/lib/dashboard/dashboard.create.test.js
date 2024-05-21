const { expect, assert } = require('chai');
const { DASHBOARD_BOX_TYPE, DASHBOARD_TYPE, DASHBOARD_VISIBILITY } = require('../../../utils/constants');

const Dashboard = require('../../../lib/dashboard');

describe('dashboard.create', () => {
  const dashboard = new Dashboard();
  it('should create a dashboard', async () => {
    const newDashboard = await dashboard.create('0cd30aef-9c4e-4a23-88e3-3547971296e5', {
      name: 'My new dashboard',
      type: DASHBOARD_TYPE.MAIN,
      position: 0,
      visibility: DASHBOARD_VISIBILITY.PRIVATE,
      boxes: [
        [
          {
            type: DASHBOARD_BOX_TYPE.USER_PRESENCE,
          },
        ],
      ],
    });
    expect(newDashboard).to.have.property('name', 'My new dashboard');
    expect(newDashboard).to.have.property('selector', 'my-new-dashboard');
  });
  it('should return error, missing box type', async () => {
    const promise = dashboard.create('0cd30aef-9c4e-4a23-88e3-3547971296e5', {
      name: 'My new dashboard',
      type: DASHBOARD_TYPE.MAIN,
      boxes: [[{}]],
    });
    return assert.isRejected(promise);
  });
});
