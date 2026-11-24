// A device edited on a phone (docs/specs/mobile-pages/device-edit.md)
describe('Device edit on a phone', () => {
  const serverUrl = Cypress.env('serverUrl');
  const selector = 'zigbee2mqtt-cy-mobile-plug';
  const editUrl = `/dashboard/integration/device/zigbee2mqtt/edit/${selector}`;
  const device = {
    name: 'Washer plug',
    external_id: 'zigbee2mqtt:cy-mobile-plug',
    selector,
    should_poll: false,
    features: [
      {
        name: 'Plug',
        category: 'switch',
        type: 'binary',
        external_id: 'zigbee2mqtt:cy-mobile-plug:switch:binary',
        selector: `${selector}-switch-binary`,
        read_only: false,
        has_feedback: true,
        keep_history: true,
        min: 0,
        max: 1
      },
      {
        name: 'Power',
        category: 'switch',
        type: 'power',
        unit: 'watt',
        external_id: 'zigbee2mqtt:cy-mobile-plug:switch:power',
        selector: `${selector}-switch-power`,
        read_only: true,
        has_feedback: false,
        keep_history: true,
        min: 0,
        max: 4000
      }
    ]
  };

  before(() => {
    cy.login();
    cy.request({ method: 'DELETE', url: `${serverUrl}/api/v1/device/${selector}`, failOnStatusCode: false });
    cy.createDevice(device, 'zigbee2mqtt');
  });

  beforeEach(() => {
    cy.login();
    cy.viewport('iphone-x');
    cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/device` }).as('saveDevice');
  });

  after(() => {
    cy.login();
    cy.request({ method: 'DELETE', url: `${serverUrl}/api/v1/device/${selector}`, failOnStatusCode: false });
  });

  it('should show the device as fields and feature rows, with nothing to save yet', () => {
    cy.visit(editUrl);
    cy.get('[data-cy=device-edit-mobile]').should('exist');
    cy.get('[data-cy=device-name]').should('have.value', 'Washer plug');
    cy.get('[data-cy=device-feature-row]').should('have.length', 2);
    cy.get('[data-cy=device-feature-row]')
      .first()
      .should('contain', 'Plug')
      .i18n('editDeviceForm.mobile.historyKept');
    cy.get('[data-cy=device-save]').should('be.disabled');
    // the chrome of the integration gives way to the navigation bar of the page
    cy.get('.hz-subpage-chrome').should('not.be.visible');
    // no field triggers the iOS zoom
    cy.get('[data-cy=device-name]').should('have.css', 'font-size', '16px');
    cy.get('[data-cy=device-room]').should('have.css', 'font-size', '16px');
  });

  it('should rename a feature and stop keeping its history from its sheet, then save', () => {
    cy.visit(editUrl);
    cy.get('[data-cy=device-feature-row]')
      .eq(1)
      .click();
    cy.get('[data-cy=device-feature-sheet]').should('be.visible');
    cy.get('[data-cy=device-feature-external-id]').should('contain', 'zigbee2mqtt:cy-mobile-plug:switch:power');
    cy.get('[data-cy=device-feature-name]').clear();
    cy.get('[data-cy=device-feature-name]').type('Instant power');
    cy.get('[data-cy=device-feature-keep-history]').should('have.attr', 'aria-checked', 'true');
    cy.get('[data-cy=device-feature-keep-history]').click();
    cy.get('[data-cy=device-feature-keep-history]').should('have.attr', 'aria-checked', 'false');
    cy.get('[data-cy=device-feature-sheet] [data-cy=sheet-ok]').click();

    cy.get('[data-cy=device-feature-row]')
      .eq(1)
      .should('contain', 'Instant power')
      .i18n('editDeviceForm.mobile.historyNotKept');
    cy.get('[data-cy=device-edit-bottom-bar]').i18n('mobileKit.unsavedChanges');

    cy.get('[data-cy=device-name]').clear();
    cy.get('[data-cy=device-name]').type('Washing machine');
    cy.get('[data-cy=device-save]')
      .should('not.be.disabled')
      .click();
    cy.wait('@saveDevice').then(({ request, response }) => {
      expect(response.statusCode).to.eq(200);
      expect(request.body.name).to.eq('Washing machine');
      expect(request.body.features[1].name).to.eq('Instant power');
      expect(request.body.features[1].keep_history).to.eq(false);
      expect(request.body.features[0].keep_history).to.eq(true);
    });
    cy.get('[data-cy=device-saved-toast]').i18n('mobileKit.saved');
    cy.get('[data-cy=device-save]').should('be.disabled');
  });

  it('should ask before leaving with unsaved changes', () => {
    cy.visit(editUrl);
    cy.get('[data-cy=device-name]').clear();
    cy.get('[data-cy=device-name]').type('Dryer');
    cy.get('[data-cy=mobile-nav-back]').click();
    cy.get('[data-cy=device-leave-confirm]').should('be.visible');
    cy.get('[data-cy=device-leave-keep-editing]').click();
    cy.get('[data-cy=device-leave-confirm]').should('not.exist');
    cy.location('pathname').should('eq', editUrl);

    cy.get('[data-cy=mobile-nav-back]').click();
    cy.get('[data-cy=device-leave-discard]').click();
    cy.location('pathname').should('eq', '/dashboard/integration/device/zigbee2mqtt');
  });

  it('should save and leave, back to the devices list it was opened from', () => {
    cy.visit(`${editUrl}?from=devices`);
    cy.get('[data-cy=mobile-nav-back]').i18n('devicesList.title');
    cy.get('[data-cy=device-name]').clear();
    cy.get('[data-cy=device-name]').type('Dryer');
    cy.get('[data-cy=mobile-nav-back]').click();
    cy.get('[data-cy=device-leave-save]').click();
    cy.wait('@saveDevice')
      .its('request.body.name')
      .should('eq', 'Dryer');
    cy.location('pathname').should('eq', '/dashboard/devices');
  });

  it('should ask before following a link of the page with unsaved changes', () => {
    cy.visit(editUrl);
    cy.get('[data-cy=device-name]').clear();
    cy.get('[data-cy=device-name]').type('Iron');
    cy.get('[data-cy=device-edit-mobile] a[href="/dashboard/settings/system"]').click();
    cy.get('[data-cy=device-leave-confirm]').should('be.visible');
    cy.location('pathname').should('eq', editUrl);
    cy.get('[data-cy=device-leave-discard]').click();
    cy.location('pathname').should('eq', '/dashboard/settings/system');
  });

  it('should ask before leaving through the system back with unsaved changes', () => {
    cy.visit(editUrl);
    cy.get('[data-cy=device-name]').clear();
    cy.get('[data-cy=device-name]').type('Iron');
    cy.get('[data-cy=device-save]').should('not.be.disabled');
    cy.go('back');
    cy.get('[data-cy=device-leave-confirm]').should('be.visible');
    cy.location('pathname').should('eq', editUrl);
    // a second "back" closes the sheet, like "Keep editing": the page and its changes stay
    cy.go('back');
    cy.get('[data-cy=device-leave-confirm]').should('not.exist');
    cy.get('[data-cy=device-name]').should('have.value', 'Iron');
    cy.get('[data-cy=device-edit-bottom-bar]').i18n('mobileKit.unsavedChanges');
    // a sheet open on top is closed first, then the guard asks
    cy.get('[data-cy=device-feature-row]')
      .first()
      .click();
    cy.get('[data-cy=device-feature-sheet]').should('be.visible');
    cy.go('back');
    cy.get('[data-cy=device-feature-sheet]').should('not.exist');
    cy.get('[data-cy=device-leave-confirm]').should('not.exist');
    cy.go('back');
    cy.get('[data-cy=device-leave-confirm]').should('be.visible');
    cy.get('[data-cy=device-leave-discard]').click();
    cy.location('pathname').should('eq', '/dashboard/integration/device/zigbee2mqtt');
  });

  it('should keep the changes unsaved when the layout changes and comes back', () => {
    cy.visit(editUrl);
    cy.get('[data-cy=device-name]').clear();
    cy.get('[data-cy=device-name]').type('Iron');
    cy.get('[data-cy=device-save]').should('not.be.disabled');
    // the card of the wider screens, then the phone layout again
    cy.viewport(1280, 800);
    cy.get('#deviceName').should('have.value', 'Iron');
    cy.viewport('iphone-x');
    cy.get('[data-cy=device-name]').should('have.value', 'Iron');
    cy.get('[data-cy=device-edit-bottom-bar]').i18n('mobileKit.unsavedChanges');
    cy.get('[data-cy=device-save]').should('not.be.disabled');
  });

  it('should keep the cards on a wider screen', () => {
    cy.viewport(1280, 800);
    cy.visit(editUrl);
    cy.get('#deviceName').should('have.value', 'Dryer');
    cy.get('[data-cy=device-edit-mobile]').should('not.exist');
    cy.get('.hz-subpage-chrome').should('be.visible');
  });
});
