const { expect, assert } = require('chai');
const { DASHBOARD_BOX_TYPE, DASHBOARD_TYPE, DASHBOARD_VISIBILITY } = require('../../../utils/constants');

const Dashboard = require('../../../lib/dashboard');

describe('dashboard.update', () => {
  const dashboard = new Dashboard();
  it('should update a dashoard', async () => {
    const updatedDashboard = await dashboard.update('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'test-dashboard', {
      name: 'New name',
    });
    expect(updatedDashboard).to.have.property('name', 'New name');
    expect(updatedDashboard).to.have.property('selector', 'test-dashboard');
  });
  it('should update a public dashboard (not created by me)', async () => {
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
    const updatedDashboard = await dashboard.update('0cd30aef-9c4e-4a23-88e3-3547971296e5', publicDashboard.selector, {
      name: 'New name',
    });
    expect(updatedDashboard).to.have.property('name', 'New name');
    expect(updatedDashboard).to.have.property('selector', publicDashboard.selector);
  });

  it('should save a weather box carrying a pinned provider', async () => {
    const updatedDashboard = await dashboard.update('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'test-dashboard', {
      boxes: [
        [
          {
            type: DASHBOARD_BOX_TYPE.WEATHER,
            house: 'test-house',
            provider: 'ext-meteo-france',
          },
        ],
        [
          {
            type: DASHBOARD_BOX_TYPE.WEATHER,
            house: 'test-house',
            // '' = automatic mode, what the select stores when unpinning
            provider: '',
          },
        ],
      ],
    });
    expect(updatedDashboard.boxes[0][0]).to.have.property('provider', 'ext-meteo-france');
    expect(updatedDashboard.boxes[1][0]).to.have.property('provider', '');
  });

  it('should save a devices box displaying the date of the last state change', async () => {
    const updatedDashboard = await dashboard.update('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'test-dashboard', {
      boxes: [
        [
          {
            type: DASHBOARD_BOX_TYPE.DEVICES,
            device_features: ['test-devicefeature'],
            display_last_state_change: true,
          },
        ],
        [
          {
            type: DASHBOARD_BOX_TYPE.DEVICES_IN_ROOM,
            room: 'test-room',
            display_last_state_change: false,
          },
        ],
      ],
    });
    expect(updatedDashboard.boxes[0][0]).to.have.property('display_last_state_change', true);
    expect(updatedDashboard.boxes[1][0]).to.have.property('display_last_state_change', false);
  });

  it('should return not found', async () => {
    const promise = dashboard.update('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'not-found-dashboard', {
      name: 'new name',
    });
    return assert.isRejected(promise, 'Dashboard not found');
  });
});
