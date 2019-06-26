const { expect, assert } = require('chai');
const { DASHBOARD_BOX_TYPE, DASHBOARD_TYPE } = require('../../../utils/constants');

const Dashboard = require('../../../lib/dashboard');

describe('dashboard.create', () => {
  const dashboard = new Dashboard();
  it('should create a dashboard', async () => {
    const newDashboard = await dashboard.create({
      name: 'My new dashboard',
      type: DASHBOARD_TYPE.MAIN,
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
    const promise = dashboard.create({
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
    const testDashboard = await dashboard.getBySelector('test-dashboard');
    expect(testDashboard).to.have.property('name', 'Test dashboard');
    expect(testDashboard).to.have.property('selector', 'test-dashboard');
  });
  it('should return not found', async () => {
    const promise = dashboard.getBySelector('not-found-dashboard');
    return assert.isRejected(promise, 'Dashboard not found');
  });
});

describe('dashboard.get', () => {
  const dashboard = new Dashboard();
  it('should return list of dashboard', async () => {
    const dashboards = await dashboard.get();
    expect(dashboards).to.deep.equal([
      {
        id: '854dda11-80c0-4476-843b-65cbc95c6a85',
        name: 'Test dashboard',
        type: 'main',
        selector: 'test-dashboard',
        updated_at: new Date('2019-02-12T07:49:07.556Z'),
      },
    ]);
  });
});

describe('dashboard.update', () => {
  const dashboard = new Dashboard();
  it('should update a dashoard', async () => {
    const updatedDashboard = await dashboard.update('test-dashboard', {
      name: 'New name',
    });
    expect(updatedDashboard).to.have.property('name', 'New name');
    expect(updatedDashboard).to.have.property('selector', 'test-dashboard');
  });
  it('should return not found', async () => {
    const promise = dashboard.update('not-found-dashboard', {
      name: 'new name',
    });
    return assert.isRejected(promise, 'Dashboard not found');
  });
});

describe('dashboard.destroy', () => {
  const dashboard = new Dashboard();
  it('should destroy a dashoard', async () => {
    await dashboard.destroy('test-dashboard');
  });
  it('should return not found', async () => {
    const promise = dashboard.destroy('not-found-dashboard');
    return assert.isRejected(promise, 'Dashboard not found');
  });
});
