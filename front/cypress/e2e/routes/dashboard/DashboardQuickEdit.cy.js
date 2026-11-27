// In-place editing of a dashboard on a phone (docs/specs/dashboard-flexible-
// layout-and-widgets.md, A.3.2): the content of the dashboard changes from the
// dashboard itself — a long press on a widget, the "+" of the dock — and is
// saved at once, with an Undo, without entering the editor.
describe('Dashboard in-place editing', () => {
  const serverUrl = Cypress.env('serverUrl');
  const probe = index => `quick-probe-${index}`;

  // a long press, the way a finger makes it: pointerdown, kept, pointerup
  const longPress = selector => {
    cy.get(selector).then($element => {
      const rect = $element[0].getBoundingClientRect();
      const options = {
        eventConstructor: 'PointerEvent',
        pointerType: 'touch',
        isPrimary: true,
        pointerId: 7,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + Math.min(rect.height / 2, 40),
        bubbles: true
      };
      cy.wrap($element).trigger('pointerdown', options);
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(700);
      // the menu is open by now, its sheet covers the widget: the finger is lifted where it is
      cy.wrap($element).trigger('pointerup', { ...options, force: true });
    });
  };

  beforeEach(() => {
    cy.login();
    const { rooms } = Cypress.env('house');
    cy.request({
      method: 'GET',
      url: `${serverUrl}/api/v1/room/${rooms[0].selector}`
    }).then(res => {
      cy.createDevice(
        {
          name: 'Quick sensor',
          external_id: 'quick-sensor',
          selector: 'quick-sensor',
          room_id: res.body.id,
          features: [1, 2].map(index => ({
            name: `Probe ${index}`,
            category: 'temperature-sensor',
            type: 'decimal',
            external_id: probe(index),
            selector: probe(index),
            unit: 'celsius',
            read_only: true,
            keep_history: true,
            has_feedback: false,
            min: -50,
            max: 100
          }))
        },
        'example'
      );
      cy.createDevice(
        {
          name: 'Quick lamp',
          external_id: 'quick-lamp',
          selector: 'quick-lamp',
          room_id: res.body.id,
          features: [
            {
              name: 'On/off',
              category: 'light',
              type: 'binary',
              external_id: 'quick-lamp-binary',
              selector: 'quick-lamp-binary',
              read_only: false,
              keep_history: true,
              has_feedback: false,
              min: 0,
              max: 1
            },
            {
              name: 'Brightness',
              category: 'light',
              type: 'brightness',
              external_id: 'quick-lamp-brightness',
              selector: 'quick-lamp-brightness',
              read_only: false,
              keep_history: true,
              has_feedback: false,
              min: 0,
              max: 100
            }
          ]
        },
        'example'
      );
    });
    cy.request({
      method: 'POST',
      url: `${serverUrl}/api/v1/dashboard`,
      body: {
        name: 'Quick',
        type: 'test',
        selector: 'quick',
        visibility: 'private',
        boxes: [
          {
            columns: [
              [
                { type: 'clock', clock_type: 'digital' },
                {
                  type: 'devices',
                  name: 'Temperatures',
                  device_features: [probe(1)],
                  device_feature_names: [rooms[0].name]
                },
                // an older widget: its rows have no stored name
                { type: 'devices', name: 'Unnamed', device_features: [probe(2)] }
              ]
            ]
          }
        ]
      }
    });
    cy.viewport(390, 664);
  });

  afterEach(() => {
    cy.deleteDevices('example');
    cy.request({
      method: 'DELETE',
      url: `${serverUrl}/api/v1/dashboard/quick`
    });
  });

  it('Should add a suggested device to a widget from a long press, and undo it', () => {
    const roomName = Cypress.env('house').rooms[0].name;
    cy.intercept('PATCH', `${serverUrl}/api/v1/dashboard/quick`).as('saveDashboard');
    cy.visit('/dashboard/quick');

    longPress('[data-box-slot][data-x="0"][data-y="1"] > *');
    cy.get('[data-cy="widget-menu"]').should('be.visible');
    cy.get('[data-cy="widget-menu-add-devices"]').click();

    // the picker suggests what the widget misses: the other temperature
    cy.get(`[data-cy="picker-suggestion-${probe(2)}"]`).click();
    cy.get('[data-cy="picker-validate"]').click();

    // saved at once, named like the rows already there (after their room)
    cy.wait('@saveDashboard').then(({ request }) => {
      const box = request.body.boxes[0].columns[0][1];
      expect(box.device_features).to.deep.equal([probe(1), probe(2)]);
      expect(box.device_feature_names[0]).to.equal(roomName);
      expect(box.device_feature_names[1]).to.contain(roomName);
    });
    cy.get('[data-cy="quick-edit-toast"]').should('be.visible');

    // Undo puts the widget back as it was
    cy.get('[data-cy="mobile-toast-action"]').click();
    cy.wait('@saveDashboard').then(({ request }) => {
      expect(request.body.boxes[0].columns[0][1].device_features).to.deep.equal([probe(1)]);
    });
  });

  it('Should add a light as one row to a new widget from the "+" of the dock', () => {
    cy.intercept('PATCH', `${serverUrl}/api/v1/dashboard/quick`).as('saveDashboard');
    cy.visit('/dashboard/quick');

    cy.get('[data-cy="dashboard-add-button"]').click();
    cy.get('[data-cy="dashboard-add-device"]').click();
    cy.get('[data-cy="picker-search"]').type('quick lamp');
    // a light is one row: ticking it takes all its controls
    cy.get('[data-cy="picker-light-quick-lamp"]').click();
    cy.get('[data-cy="picker-diff"]').should('contain', '+1');
    cy.get('[data-cy="picker-validate"]').click();

    // where: the existing devices widget, or a new one at the top or the bottom
    cy.get('[data-cy="add-to-dashboard-widget-0-1"]').should('be.visible');
    cy.get('[data-cy="add-to-dashboard-top"]').click();
    cy.wait('@saveDashboard').then(({ request }) => {
      const box = request.body.boxes[0].columns[0][0];
      expect(box.type).to.equal('devices');
      expect(box.device_features).to.deep.equal(['quick-lamp-binary', 'quick-lamp-brightness']);
      expect(box.device_feature_names).to.deep.equal(['Quick lamp', 'Quick lamp']);
    });
    cy.get('[data-box-slot][data-x="0"][data-y="0"]').should('have.attr', 'data-box-type', 'devices');
  });

  it('Should add a device to a widget whose rows have no stored name', () => {
    cy.intercept('PATCH', `${serverUrl}/api/v1/dashboard/quick`).as('saveDashboard');
    cy.visit('/dashboard/quick');

    cy.get('[data-cy="dashboard-add-button"]').click();
    cy.get('[data-cy="dashboard-add-device"]').click();
    cy.get('[data-cy="picker-search"]').type('quick lamp');
    cy.get('[data-cy="picker-light-quick-lamp"]').click();
    cy.get('[data-cy="picker-validate"]').click();

    cy.get('[data-cy="add-to-dashboard-widget-0-2"]').click();
    // the unnamed row is saved with the label it shows: the server only takes strings
    cy.wait('@saveDashboard').then(({ request, response }) => {
      expect(response.statusCode).to.equal(200);
      const box = request.body.boxes[0].columns[0][2];
      expect(box.device_features).to.deep.equal([probe(2), 'quick-lamp-binary', 'quick-lamp-brightness']);
      expect(box.device_feature_names).to.have.length(3);
      expect(box.device_feature_names[0]).to.contain('Quick sensor');
      expect(box.device_feature_names.slice(1)).to.deep.equal(['Quick lamp', 'Quick lamp']);
    });
    cy.get('[data-cy="quick-edit-toast"]').should('be.visible');
  });

  it('Should open the editor on the widget from its long-press menu', () => {
    cy.visit('/dashboard/quick');
    longPress('[data-box-slot][data-x="0"][data-y="1"] > *');
    cy.get('[data-cy="widget-menu-layout"]').click();
    cy.url().should('match', /\/dashboard\/quick\/edit$/);
    // the widget is selected: its toolbar shows
    cy.get('[data-widget-wrapper][data-x="0"][data-y="1"]').should('have.attr', 'data-selected', 'true');
    cy.get('[data-cy="move-box-up-0-1"]').should('be.visible');
  });
});
