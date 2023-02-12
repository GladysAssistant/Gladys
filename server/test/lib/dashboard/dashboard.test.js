const { expect, assert } = require('chai');
const { DASHBOARD_BOX_TYPE, DASHBOARD_TYPE } = require('../../../utils/constants');

const Dashboard = require('../../../lib/dashboard');
const db = require('../../../models');

describe('dashboard.create', () => {
  const dashboard = new Dashboard();
  it('should create a dashboard', async () => {
    const newDashboard = await dashboard.create('0cd30aef-9c4e-4a23-88e3-3547971296e5', {
      name: 'My new dashboard',
      type: DASHBOARD_TYPE.MAIN,
      position: 0,
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

describe('dashboard.getBySelector', () => {
  const dashboard = new Dashboard();
  it('should return dashboard', async () => {
    const testDashboard = await dashboard.getBySelector('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'test-dashboard');
    expect(testDashboard).to.have.property('name', 'Test dashboard');
    expect(testDashboard).to.have.property('selector', 'test-dashboard');
  });
  it('should return not found', async () => {
    const promise = dashboard.getBySelector('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'not-found-dashboard');
    return assert.isRejected(promise, 'Dashboard not found');
  });
});

describe('dashboard.get', () => {
  const dashboard = new Dashboard();
  it('should return list of dashboard', async () => {
    const dashboards = await dashboard.get('0cd30aef-9c4e-4a23-88e3-3547971296e5');
    expect(dashboards).to.deep.equal([
      {
        id: '854dda11-80c0-4476-843b-65cbc95c6a85',
        name: 'Test dashboard',
        type: 'main',
        selector: 'test-dashboard',
        updated_at: '2019-02-12 07:49:07.556 +00:00',
      },
    ]);
  });
});

describe('dashboard.update', () => {
  const dashboard = new Dashboard();
  it('should update a dashoard', async () => {
    const updatedDashboard = await dashboard.update('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'test-dashboard', {
      name: 'New name',
    });
    expect(updatedDashboard).to.have.property('name', 'New name');
    expect(updatedDashboard).to.have.property('selector', 'test-dashboard');
  });
  it('should return not found', async () => {
    const promise = dashboard.update('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'not-found-dashboard', {
      name: 'new name',
    });
    return assert.isRejected(promise, 'Dashboard not found');
  });
});

describe('dashboard.updateOrder', () => {
  const dashboard = new Dashboard();
  it('should update the order of dashboards', async () => {
    const newDashboard = await dashboard.create('0cd30aef-9c4e-4a23-88e3-3547971296e5', {
      name: 'My new dashboard',
      type: DASHBOARD_TYPE.MAIN,
      position: 0,
      boxes: [
        [
          {
            type: DASHBOARD_BOX_TYPE.USER_PRESENCE,
          },
        ],
      ],
    });
    await dashboard.updateOrder('0cd30aef-9c4e-4a23-88e3-3547971296e5', [newDashboard.selector, 'test-dashboard']);
    const dashboardsInNewOrder = await db.Dashboard.findAll({
      attributes: ['selector', 'position'],
      order: [['position', 'asc']],
      raw: true,
    });
    expect(dashboardsInNewOrder).to.deep.equal([
      { selector: 'my-new-dashboard', position: 0 },
      { selector: 'test-dashboard', position: 1 },
    ]);
  });
});

describe('dashboard.destroy', () => {
  const dashboard = new Dashboard();
  it('should destroy a dashoard', async () => {
    await dashboard.destroy('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'test-dashboard');
  });
  it('should return not found', async () => {
    const promise = dashboard.destroy('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'not-found-dashboard');
    return assert.isRejected(promise, 'Dashboard not found');
  });
});
