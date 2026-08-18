const { expect, assert } = require('chai');
const { DASHBOARD_BOX_TYPE, DASHBOARD_TYPE, DASHBOARD_VISIBILITY } = require('../../../utils/constants');

const Dashboard = require('../../../lib/dashboard');

const USER_ID = '0cd30aef-9c4e-4a23-88e3-3547971296e5';
const OTHER_USER_ID = '7a137a56-069e-4996-8816-36558174b727';

describe('dashboard.duplicate', () => {
  const dashboard = new Dashboard();

  it('should duplicate a dashboard', async () => {
    const duplicatedDashboard = await dashboard.duplicate(USER_ID, 'test-dashboard', 'Copy of Test dashboard');
    expect(duplicatedDashboard).to.have.property('name', 'Copy of Test dashboard');
    expect(duplicatedDashboard).to.have.property('type', DASHBOARD_TYPE.MAIN);
    expect(duplicatedDashboard).to.have.property('user_id', USER_ID);
    expect(duplicatedDashboard).to.have.property('visibility', DASHBOARD_VISIBILITY.PRIVATE);
    // The duplicate is placed after the dashboards the user already has
    expect(duplicatedDashboard).to.have.property('position', 1);
    // The boxes of the source dashboard are copied as is
    expect(duplicatedDashboard.boxes).to.deep.equal([[{ type: DASHBOARD_BOX_TYPE.WEATHER }]]);
    // The selector is new and unique: slug + dash + 4 random characters
    expect(duplicatedDashboard.selector).to.contain('copy-of-test-dashboard');
    expect(duplicatedDashboard.selector).to.have.lengthOf('copy-of-test-dashboard'.length + 5);
  });

  it('should duplicate my own public dashboard and keep it public', async () => {
    const publicDashboard = await dashboard.create(USER_ID, {
      name: 'My public dashboard',
      type: DASHBOARD_TYPE.MAIN,
      visibility: DASHBOARD_VISIBILITY.PUBLIC,
      boxes: [[{ type: DASHBOARD_BOX_TYPE.USER_PRESENCE }]],
    });
    const duplicatedDashboard = await dashboard.duplicate(
      USER_ID,
      publicDashboard.selector,
      'Copy of my public dashboard',
    );
    expect(duplicatedDashboard).to.have.property('user_id', USER_ID);
    expect(duplicatedDashboard).to.have.property('visibility', DASHBOARD_VISIBILITY.PUBLIC);
    expect(duplicatedDashboard.boxes).to.deep.equal([[{ type: DASHBOARD_BOX_TYPE.USER_PRESENCE }]]);
  });

  it('should duplicate a public dashboard of another user as a private dashboard', async () => {
    const publicDashboard = await dashboard.create(OTHER_USER_ID, {
      name: 'Public dashboard of another user',
      type: DASHBOARD_TYPE.MAIN,
      visibility: DASHBOARD_VISIBILITY.PUBLIC,
      boxes: [[{ type: DASHBOARD_BOX_TYPE.USER_PRESENCE }]],
    });
    const duplicatedDashboard = await dashboard.duplicate(USER_ID, publicDashboard.selector, 'Copy of a public one');
    // The copy belongs to the user asking for it, and is not re-shared
    expect(duplicatedDashboard).to.have.property('user_id', USER_ID);
    expect(duplicatedDashboard).to.have.property('visibility', DASHBOARD_VISIBILITY.PRIVATE);
  });

  it('should return not found', async () => {
    const promise = dashboard.duplicate(USER_ID, 'not-found-dashboard', 'New dashboard');
    return assert.isRejected(promise, 'Dashboard not found');
  });

  it('should return not found for a private dashboard I cannot see', async () => {
    const privateDashboard = await dashboard.create(OTHER_USER_ID, {
      name: 'Private dashboard of another user',
      type: DASHBOARD_TYPE.MAIN,
      visibility: DASHBOARD_VISIBILITY.PRIVATE,
      boxes: [[{ type: DASHBOARD_BOX_TYPE.USER_PRESENCE }]],
    });
    const promise = dashboard.duplicate(USER_ID, privateDashboard.selector, 'New dashboard');
    return assert.isRejected(promise, 'Dashboard not found');
  });
});
