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

    // compact list: one row per feature, no text input in the list; the
    // sheet replaces the editor's action bar while it is open
    cy.get('[data-cy="devices-row-0"]').should('contain', defaultName(1));
    cy.get('[data-device-row] input').should('not.exist');
    cy.get('[data-cy="edit-actions"]').should('not.be.visible');

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
    cy.get('[data-cy="edit-panel-back"]').click();
    cy.get('[data-cy="devices-row-2"]').should('contain', defaultName(2));

    // rename and move to the top with the buttons
    cy.get('[data-cy="devices-row-2"] button')
      .first()
      .click();
    // a name is stored trimmed
    cy.get('[data-cy="devices-detail-name"]').type('Outside ');
    // the row being edited is outlined in the widget's live preview
    cy.get('.gladys-editing-device-row').should('contain', 'Outside');
    cy.get('[data-cy="devices-detail-up"]').click();
    cy.get('[data-cy="devices-detail-up"]').click();
    cy.get('[data-cy="devices-detail-up"]').should('be.disabled');
    cy.get('[data-cy="edit-panel-back"]').click();
    cy.get('[data-cy="devices-row-0"]').should('contain', 'Outside');

    // removing asks nothing, and can be undone
    cy.get('[data-cy="devices-row-1"] button')
      .first()
      .click();
    cy.get('[data-cy="devices-detail-remove"]').click();
    cy.get('[data-device-row]').should('have.length', 2);
    cy.get('[data-cy="devices-undo"] button').click();
    cy.get('[data-device-row]').should('have.length', 3);

    // the picker also removes: unchecking a feature drops it
    cy.get('[data-cy="devices-add-button"]').click();
    cy.get(`[data-cy="picker-feature-${probe(3)}"]`).click();
    cy.get('[data-cy="picker-diff"]').should('contain', '−1');
    cy.get('[data-cy="picker-validate"]').click();
    cy.get('[data-device-row]').should('have.length', 2);
    cy.get('[data-cy="devices-undo"]').should('be.visible');

    // any later edit dismisses the pending undo: it would revert that edit too
    cy.get('[data-cy="devices-row-1"] button')
      .first()
      .click();
    cy.get('[data-cy="devices-detail-name"]').type('Living');
    cy.get('[data-cy="edit-panel-back"]').click();
    // short timeout: the bar also expires on its own after 6s, which must
    // not be what makes this assertion pass
    cy.get('[data-cy="devices-undo"]', { timeout: 1000 }).should('not.exist');

    // the action bar comes back with Save once the sheet is closed
    cy.get('[data-cy="edit-panel-close"]').click();
    cy.get('[data-cy="edit-panel"]').should('not.exist');
    cy.contains('button', Cypress.env('i18n').dashboard.editDashboardSaveButton).click();
    cy.wait('@saveDashboard').then(({ request }) => {
      const box = request.body.boxes[0].columns[0][0];
      expect(box.device_features).to.deep.equal([probe(2), probe(1)]);
      expect(box.device_feature_names).to.deep.equal(['Outside', 'Living']);
    });
  });

  it('Should keep the preview empty once the last device is removed', () => {
    cy.viewport(390, 664);
    cy.visit('/dashboard/test/edit');
    cy.get('[data-cy="edit-box-0-0"]').click();
    cy.get('[data-widget-wrapper][data-editing] tbody tr').should('have.length', 1);

    cy.get('[data-cy="devices-add-button"]').click();
    cy.get(`[data-cy="picker-feature-${probe(1)}"]`).click();
    cy.get('[data-cy="picker-validate"]').click();
    cy.get('[data-device-row]').should('have.length', 0);

    // an empty device_feature_selectors filter is no filter: the preview
    // must not fall back to every device of the house
    cy.get('[data-widget-wrapper][data-editing] tbody tr').should('have.length', 0);
  });

  // a devices widget without device_features — just created from the widget
  // picker, or stored that way — must not loop on re-renders (it froze the tab)
  it('Should create a devices widget from the widget picker', () => {
    cy.viewport(390, 664);
    cy.visit('/dashboard/test/edit');
    cy.contains('.btn-primary', 'dashboard.addBoxButton')
      .first()
      .click();
    cy.get('[data-cy="box-type-popular-devices"]').click();
    // the new widget opens straight on the picker, and the page still answers
    cy.get(`[data-cy="picker-feature-${probe(2)}"]`).click();
    cy.get('[data-cy="picker-validate"]').click();
    cy.get('[data-device-row]').should('have.length', 1);
    cy.get('[data-widget-wrapper][data-editing] tbody tr').should('have.length', 1);
  });

  it('Should show a stored devices widget that has no devices', () => {
    cy.request({
      method: 'PATCH',
      url: `${serverUrl}/api/v1/dashboard/test`,
      body: { boxes: [{ columns: [[{ type: 'devices', name: 'Empty' }], [{ type: 'clock', clock_type: 'digital' }]] }] }
    });
    cy.visit('/dashboard/test');
    cy.contains('Empty');
    // the page is responsive: the editor opens and the widget can be removed
    cy.visit('/dashboard/test/edit');
    cy.get('[data-cy="remove-box-0-0"]').click();
    cy.get('[data-widget-wrapper][data-x="0"]').should('have.length', 0);
  });
});
