// The "Delete" button of a device card asks first, on every screen size
// (docs/specs/mobile-pages/integration-devices.md, D). The lists and the writes are stubbed:
// the cards are known and nothing real is deleted.
describe('Deleting a device from its integration, on a wide screen', () => {
  const serverUrl = Cypress.env('serverUrl');
  const api = path => `${serverUrl}/api/v1${path}`;

  const probe = {
    id: 'cy-mqtt-probe',
    name: 'Outdoor probe',
    selector: 'mqtt-cy-outdoor-probe',
    external_id: 'mqtt:cy-outdoor-probe',
    room_id: null,
    created_at: '2026-01-01T00:00:00.000Z',
    features: []
  };
  const lamp = {
    id: 'cy-z2m-lamp',
    name: 'Living room lamp',
    selector: 'zigbee2mqtt-cy-living-room-lamp',
    external_id: 'zigbee2mqtt:cy-living-room-lamp',
    room_id: null,
    created_at: '2026-01-01T00:00:00.000Z',
    features: [],
    params: []
  };

  beforeEach(() => {
    cy.viewport(1280, 800);
    cy.login();
  });

  it('should delete an MQTT device only once confirmed', () => {
    cy.intercept({ method: 'GET', url: api('/service/mqtt/device*') }, [probe]).as('getDevices');
    cy.intercept({ method: 'GET', url: api('/service/mqtt/status') }, { configured: true, connected: true });
    cy.intercept({ method: 'DELETE', url: api('/device/mqtt-cy-outdoor-probe') }, { success: true }).as('deleteDevice');
    cy.visit('/dashboard/integration/device/mqtt');
    cy.wait('@getDevices');

    cy.get('[data-cy=device-delete]').click();
    cy.get('[data-cy=device-delete-confirm]')
      .should('be.visible')
      .and('contain', 'Outdoor probe');
    cy.get('[data-cy=device-delete-confirm] [data-cy=confirm-sheet-cancel]').click();
    cy.get('[data-cy=device-delete-confirm]').should('not.exist');
    cy.get('@deleteDevice.all').should('have.length', 0);
    cy.contains('Outdoor probe').should('be.visible');

    cy.get('[data-cy=device-delete]').click();
    cy.get('[data-cy=device-delete-confirm] [data-cy=confirm-sheet-confirm]').click();
    cy.wait('@deleteDevice');
    cy.get('[data-cy=device-delete-confirm]').should('not.exist');
    cy.contains('Outdoor probe').should('not.exist');
  });

  it('should say on the card that a confirmed deletion failed', () => {
    cy.intercept({ method: 'GET', url: api('/service/zigbee2mqtt/device*') }, [lamp]).as('getDevices');
    cy.intercept(
      { method: 'DELETE', url: api('/device/zigbee2mqtt-cy-living-room-lamp') },
      { statusCode: 500, body: {} }
    ).as('deleteDevice');
    cy.visit('/dashboard/integration/device/zigbee2mqtt');
    cy.wait('@getDevices');

    cy.get('[data-cy=device-delete]').click();
    cy.get('[data-cy=device-delete-confirm]')
      .should('be.visible')
      .and('contain', 'Living room lamp');
    cy.get('[data-cy=device-delete-confirm] [data-cy=confirm-sheet-confirm]').click();
    cy.wait('@deleteDevice');
    cy.get('[data-cy=device-delete-confirm]').should('not.exist');
    // the card is still there, and says why
    cy.get('.alert-danger')
      .should('be.visible')
      .i18n('mobileDeviceList.deleteError');
    cy.get('[data-cy=device-delete]').should('be.visible');
  });
});
