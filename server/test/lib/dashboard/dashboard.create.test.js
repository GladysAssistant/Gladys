const { expect, assert } = require('chai');
const { DASHBOARD_BOX_TYPE, DASHBOARD_TYPE, DASHBOARD_VISIBILITY } = require('../../../utils/constants');

const Dashboard = require('../../../lib/dashboard');

describe('dashboard.create', () => {
  const dashboard = new Dashboard();
  it('should create a dashboard with a random selector', async () => {
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
    expect(newDashboard.selector).to.contain('my-new-dashboard');
    // selector should have 4 random characters at the end + dash
    expect(newDashboard.selector).to.have.lengthOf('my-new-dashboard'.length + 5);
  });
  it('should create a dashboard with the selector given', async () => {
    const newDashboard = await dashboard.create('0cd30aef-9c4e-4a23-88e3-3547971296e5', {
      name: 'My dashboard with a custom selector',
      selector: 'my-custom-dashboard-selector',
      type: DASHBOARD_TYPE.MAIN,
      position: 0,
      visibility: DASHBOARD_VISIBILITY.PRIVATE,
      boxes: [[]],
    });
    expect(newDashboard).to.have.property('selector', 'my-custom-dashboard-selector');
  });
  it('should create two dashboards with names sharing the same slug', async () => {
    const firstDashboard = await dashboard.create('0cd30aef-9c4e-4a23-88e3-3547971296e5', {
      name: 'Salon',
      type: DASHBOARD_TYPE.MAIN,
      position: 0,
      visibility: DASHBOARD_VISIBILITY.PRIVATE,
      boxes: [[]],
    });
    const secondDashboard = await dashboard.create('0cd30aef-9c4e-4a23-88e3-3547971296e5', {
      name: 'Salôn',
      type: DASHBOARD_TYPE.MAIN,
      position: 0,
      visibility: DASHBOARD_VISIBILITY.PRIVATE,
      boxes: [[]],
    });
    expect(firstDashboard.selector).to.contain('salon');
    expect(secondDashboard.selector).to.contain('salon');
    expect(firstDashboard.selector).to.not.equal(secondDashboard.selector);
  });
  it('should return error, missing name', async () => {
    const promise = dashboard.create('0cd30aef-9c4e-4a23-88e3-3547971296e5', {
      type: DASHBOARD_TYPE.MAIN,
      visibility: DASHBOARD_VISIBILITY.PRIVATE,
      boxes: [[]],
    });
    return assert.isRejected(promise);
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
