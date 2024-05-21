const { expect, assert } = require('chai');
const { DASHBOARD_BOX_TYPE, DASHBOARD_TYPE, DASHBOARD_VISIBILITY } = require('../../../utils/constants');

const Dashboard = require('../../../lib/dashboard');

describe('dashboard.getBySelector', () => {
  const dashboard = new Dashboard();
  it('should return dashboard', async () => {
    const testDashboard = await dashboard.getBySelector('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'test-dashboard');
    expect(testDashboard).to.have.property('name', 'Test dashboard');
    expect(testDashboard).to.have.property('selector', 'test-dashboard');
  });
  it('should return public dashboard (not created by me)', async () => {
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
    const testDashboard = await dashboard.getBySelector(
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      publicDashboard.selector,
    );
    expect(testDashboard).to.have.property('name', publicDashboard.name);
    expect(testDashboard).to.have.property('visibility', 'public');
    expect(testDashboard).to.have.property('user_id', '7a137a56-069e-4996-8816-36558174b727');
  });
  it('should return not found', async () => {
    const promise = dashboard.getBySelector('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'not-found-dashboard');
    return assert.isRejected(promise, 'Dashboard not found');
  });
  it('should return not found for private dashboard I cannot see', async () => {
    const privateDashboard = await dashboard.create('7a137a56-069e-4996-8816-36558174b727', {
      name: 'My new public dashboard',
      selector: 'my-new-public-dashoard',
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
    const promise = dashboard.getBySelector('0cd30aef-9c4e-4a23-88e3-3547971296e5', privateDashboard.selector);
    return assert.isRejected(promise, 'Dashboard not found');
  });
});
