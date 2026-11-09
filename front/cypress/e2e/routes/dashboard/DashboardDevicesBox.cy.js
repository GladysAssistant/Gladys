// Editor of the "devices" widget (docs/specs/dashboard-flexible-layout-and-
// widgets.md, A.3.1): compact list, detail view (rename, move, remove) and
// the multi-select picker, all inside the edit panel. It replaced the
// react-select dropdown whose menu placement DashboardDevicesBoxSelect
// covered (forum 10749): that dropdown is gone from this widget.
describe('Dashboard Devices Box editor', () => {
  const serverUrl = Cypress.env('serverUrl');
  const probe = index => `multi-sensor-probe-${index}`;
  const defaultName = index => `Multi sensor (Probe ${index})`;

  beforeEach(() => {
    cy.login();

    cy.request({
      method: 'POST',
      url: `${serverUrl}/api/v1/dashboard`,
      body: {
        name: 'Test',
        type: 'test',
        selector: 'test',
        visibility: 'private',
        boxes: [
          [
            {
              type: 'devices',
              name: 'Sensors',
              device_features: [probe(1)],
              device_feature_names: [defaultName(1)]
            }
          ],
          [],
          []
        ]
      }
    });

    const { rooms } = Cypress.env('house');
    cy.request({
      method: 'GET',
      url: `${serverUrl}/api/v1/room/${rooms[0].selector}`
    }).then(res => {
      cy.createDevice(
        {
          name: 'Multi sensor',
          external_id: 'multi-sensor',
          selector: 'multi-sensor',
          room_id: res.body.id,
          features: [1, 2, 3].map(index => ({
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
    });
  });

  afterEach(() => {
    cy.deleteDevices('example');
    cy.request({
      method: 'DELETE',
      url: `${serverUrl}/api/v1/dashboard/test`
    });
  });

  it('Should add, rename, reorder and remove devices, then save them', () => {
    cy.viewport(390, 664);
    cy.intercept('PATCH', `${serverUrl}/api/v1/dashboard/test`).as('saveDashboard');
    cy.visit('/dashboard/test/edit');
    cy.get('[data-cy="edit-box-0-0"]').click();

    // compact list: one row per feature, no text input in the list
    cy.get('[data-cy="devices-row-0"]').should('contain', defaultName(1));
    cy.get('[data-device-row] input').should('not.exist');

    // picker: the features already in the widget start checked
    cy.get('[data-cy="devices-add-button"]').click();
    cy.get('[data-cy="device-feature-picker"]').should('be.visible');
    cy.get(`[data-cy="picker-feature-${probe(1)}"] input`).should('be.checked');

    // every typed word must match
    cy.get('[data-cy="picker-search"]').type('multi probe 3');
    cy.get('[data-cy^="picker-feature-"]').should('have.length', 1);
    cy.get(`[data-cy="picker-feature-${probe(3)}"]`).click();
    cy.get('[data-cy="picker-search"]').clear();
    cy.get(`[data-cy="picker-feature-${probe(2)}"]`).click();
    cy.get('[data-cy="picker-diff"]').should('contain', '+2');
    cy.get('[data-cy="picker-validate"]').click();

    // new features are appended in the order they were checked
    cy.get('[data-device-row]').should('have.length', 3);
    cy.get('[data-cy="devices-row-1"]').should('contain', defaultName(3));
    cy.get('[data-cy="devices-row-2"]').should('contain', defaultName(2));
    cy.get('[data-cy="devices-undo"]').should('be.visible');

    // detail: an erased name falls back to the default name right away
    cy.get('[data-cy="devices-row-2"] button')
      .first()
      .click();
    cy.get('[data-cy="devices-detail-name"]').type('Garden');
    cy.get('[data-cy="devices-detail-name"]').clear();
    cy.get('[data-cy="devices-detail-back"]').click();
    cy.get('[data-cy="devices-row-2"]').should('contain', defaultName(2));

    // rename and move to the top with the buttons
    cy.get('[data-cy="devices-row-2"] button')
      .first()
      .click();
    cy.get('[data-cy="devices-detail-name"]').type('Outside');
    cy.get('[data-cy="devices-detail-up"]').click();
    cy.get('[data-cy="devices-detail-up"]').click();
    cy.get('[data-cy="devices-detail-up"]').should('be.disabled');
    cy.get('[data-cy="devices-detail-back"]').click();
    cy.get('[data-cy="devices-row-0"]').should('contain', 'Outside');

    // removing asks nothing, and can be undone
    cy.get('[data-cy="devices-row-1"] button')
      .first()
      .click();
    cy.get('[data-cy="devices-detail-remove"]').click();
    cy.get('[data-device-row]').should('have.length', 2);
    cy.get('[data-cy="devices-undo"] button').click();
    cy.get('[data-device-row]').should('have.length', 3);

    cy.contains('button', Cypress.env('i18n').dashboard.editDashboardSaveButton).click();
    cy.wait('@saveDashboard').then(({ request }) => {
      const box = request.body.boxes[0].columns[0][0];
      expect(box.device_features).to.deep.equal([probe(2), probe(1), probe(3)]);
      expect(box.device_feature_names).to.deep.equal(['Outside', defaultName(1), defaultName(3)]);
    });
  });
});
