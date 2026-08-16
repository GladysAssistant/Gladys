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
    // legacy column-based boxes are normalized to a single section on save
    expect(updatedDashboard.boxes[0].columns[0][0]).to.have.property('provider', 'ext-meteo-france');
    expect(updatedDashboard.boxes[0].columns[1][0]).to.have.property('provider', '');
  });

  it('should save section-based boxes as-is', async () => {
    const updatedDashboard = await dashboard.update('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'test-dashboard', {
      boxes: [
        {
          columns: [[{ type: DASHBOARD_BOX_TYPE.CLOCK }], []],
        },
        {
          columns: [[], [{ type: DASHBOARD_BOX_TYPE.USER_PRESENCE }], [], []],
        },
      ],
    });
    expect(updatedDashboard.boxes).to.have.lengthOf(2);
    expect(updatedDashboard.boxes[0].columns[0][0]).to.have.property('type', DASHBOARD_BOX_TYPE.CLOCK);
    expect(updatedDashboard.boxes[1].columns).to.have.lengthOf(4);
  });

  it('should update the dashboard appearance', async () => {
    const updatedDashboard = await dashboard.update('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'test-dashboard', {
      icon: 'home',
      background_image: 'https://example.com/background.jpg',
      card_style: 'glass',
      width: 'full',
    });
    expect(updatedDashboard).to.have.property('icon', 'home');
    expect(updatedDashboard).to.have.property('background_image', 'https://example.com/background.jpg');
    expect(updatedDashboard).to.have.property('card_style', 'glass');
    expect(updatedDashboard).to.have.property('width', 'full');
  });

  it('should reject an unknown dashboard width', async () => {
    const promise = dashboard.update('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'test-dashboard', {
      width: 'ultra-wide',
    });
    return assert.isRejected(promise);
  });

  it('should save a section with 6 columns', async () => {
    const updatedDashboard = await dashboard.update('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'test-dashboard', {
      boxes: [{ columns: [[], [], [], [], [], []] }],
    });
    expect(updatedDashboard.boxes[0].columns).to.have.lengthOf(6);
  });

  it('should reject a non-http background image', async () => {
    const promise = dashboard.update('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'test-dashboard', {
      background_image: 'javascript:alert(1)',
    });
    return assert.isRejected(promise);
  });

  it('should reject an unknown card style', async () => {
    const promise = dashboard.update('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'test-dashboard', {
      card_style: 'neon',
    });
    return assert.isRejected(promise);
  });

  it('should save a chips box', async () => {
    const updatedDashboard = await dashboard.update('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'test-dashboard', {
      boxes: [
        {
          columns: [
            [
              {
                type: DASHBOARD_BOX_TYPE.CHIPS,
                chips: [
                  { chip_type: 'device-feature', device_feature: 'my-sensor', label: 'Garage' },
                  { chip_type: 'openings', house: 'my-house' },
                  { chip_type: 'alarm', house: 'my-house' },
                  {
                    chip_type: 'calendar-next-event',
                    calendars: ['trash-calendar'],
                    calendar_event_name_filter: 'poubelle',
                  },
                ],
              },
            ],
          ],
        },
      ],
    });
    expect(updatedDashboard.boxes[0].columns[0][0].chips).to.have.lengthOf(4);
  });

  it('should save a house-view box with pins', async () => {
    const updatedDashboard = await dashboard.update('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'test-dashboard', {
      boxes: [
        {
          columns: [
            [
              {
                type: DASHBOARD_BOX_TYPE.HOUSE_VIEW,
                image: 'gallery:house-solar',
                pins: [
                  { x_pct: 32.5, y_pct: 18, device_feature: 'solar-power', label: 'Solaire', icon: 'sun' },
                  { x_pct: 70, y_pct: 60, device_feature: 'house-power' },
                ],
              },
            ],
          ],
        },
      ],
    });
    expect(updatedDashboard.boxes[0].columns[0][0].pins).to.have.lengthOf(2);
  });

  it('should reject a house-view image outside gallery/asset references', async () => {
    const promise = dashboard.update('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'test-dashboard', {
      boxes: [
        {
          columns: [[{ type: DASHBOARD_BOX_TYPE.HOUSE_VIEW, image: 'https://evil.com/image.png' }]],
        },
      ],
    });
    return assert.isRejected(promise);
  });

  it('should reject a house-view pin outside the image bounds', async () => {
    const promise = dashboard.update('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'test-dashboard', {
      boxes: [
        {
          columns: [
            [
              {
                type: DASHBOARD_BOX_TYPE.HOUSE_VIEW,
                image: 'gallery:house-solar',
                pins: [{ x_pct: 120, y_pct: 18, device_feature: 'solar-power' }],
              },
            ],
          ],
        },
      ],
    });
    return assert.isRejected(promise);
  });

  it('should save a scene box with status features', async () => {
    const updatedDashboard = await dashboard.update('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'test-dashboard', {
      boxes: [
        {
          columns: [
            [
              {
                type: DASHBOARD_BOX_TYPE.SCENE,
                scenes: ['open-shutters'],
                scene_status_features: { 'open-shutters': 'shutter-position' },
              },
            ],
          ],
        },
      ],
    });
    expect(updatedDashboard.boxes[0].columns[0][0].scene_status_features).to.deep.equal({
      'open-shutters': 'shutter-position',
    });
  });

  it('should reject a chip with an unknown chip_type', async () => {
    const promise = dashboard.update('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'test-dashboard', {
      boxes: [
        {
          columns: [[{ type: DASHBOARD_BOX_TYPE.CHIPS, chips: [{ chip_type: 'invalid' }] }]],
        },
      ],
    });
    return assert.isRejected(promise);
  });

  it('should reject a section with more than 6 columns', async () => {
    const promise = dashboard.update('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'test-dashboard', {
      boxes: [
        {
          columns: [[], [], [], [], [], [], []],
        },
      ],
    });
    return assert.isRejected(promise);
  });

  it('should reject a section without columns', async () => {
    const promise = dashboard.update('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'test-dashboard', {
      boxes: [{ type: DASHBOARD_BOX_TYPE.CLOCK }],
    });
    return assert.isRejected(promise);
  });

  it('should return not found', async () => {
    const promise = dashboard.update('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'not-found-dashboard', {
      name: 'new name',
    });
    return assert.isRejected(promise, 'Dashboard not found');
  });
});
