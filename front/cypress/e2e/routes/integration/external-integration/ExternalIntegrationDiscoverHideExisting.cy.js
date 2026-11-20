// The Discovery screen of an external integration lists every device the
// integration publishes, the ones already added included. The "Hide devices
// already added" toggle, on by default, hides them, except a device waiting for its "Update"
// (re-published with a different structure): hiding it would hide the only
// way to apply the new definition. The integration is stubbed (it would need
// an installed Docker container).
const SELECTOR = 'ext-dev-plugs';
const DISCOVER_PAGE_URL = `/dashboard/integration/device/external/${SELECTOR}/discover`;
const HIDE_EXISTING_KEY = 'gladys_assistant_v1_external_integration_discover_hide_existing';

const INTEGRATION = {
  id: '0b6f2c1e-7d3a-4c5b-9e8f-2a1b3c4d5e11',
  name: 'Plugs',
  selector: SELECTOR,
  type: 'external',
  status: 'RUNNING',
  running: true,
  version: '1.0.0',
  granted_devices: [],
  manifest: {
    name: 'Plugs',
    type: 'device',
    version: '1.0.0'
  }
};

const plug = (name, extra) => ({
  name,
  external_id: `ext:${SELECTOR}:${name.toLowerCase().replace(/ /g, '-')}`,
  service_id: INTEGRATION.id,
  params: [],
  features: [
    {
      name: `${name} power`,
      external_id: `ext:${SELECTOR}:${name.toLowerCase().replace(/ /g, '-')}:power`,
      category: 'switch',
      type: 'binary',
      read_only: false,
      keep_history: true,
      has_feedback: true,
      min: 0,
      max: 1
    }
  ],
  ...extra
});

const DISCOVERED_DEVICES = [
  plug('New plug', { created: false }),
  plug('Added plug', { created: true, structure_changed: false }),
  plug('Changed plug', { created: true, structure_changed: true })
];

const cardTitles = () => cy.get('.dimmer-content .row .card-header');

describe('External integration - discovery, hide devices already added', () => {
  beforeEach(() => {
    cy.login();
    cy.intercept('GET', `**/api/v1/external_integration/${SELECTOR}`, INTEGRATION).as('getIntegration');
    cy.intercept('GET', `**/api/v1/external_integration/${SELECTOR}/discovered_device`, DISCOVERED_DEVICES).as(
      'getDiscoveredDevices'
    );
  });

  it('hides the added devices up to date by default, keeps the ones to update, and remembers turning it off', () => {
    cy.visit(DISCOVER_PAGE_URL, {
      onBeforeLoad: win => win.localStorage.removeItem(HIDE_EXISTING_KEY)
    });
    cy.wait(['@getIntegration', '@getDiscoveredDevices']);

    // on by default: the added device is hidden, the one to update stays
    cardTitles().should('have.length', 2);
    cardTitles()
      .eq(0)
      .should('contain', 'New plug');
    cardTitles()
      .eq(1)
      .should('contain', 'Changed plug');

    // turned off: every published device is listed, and the choice is kept
    cy.contains('label', 'integration.externalIntegration.discover.hideExistingDevices').click();
    cardTitles().should('have.length', 3);
    cy.window().then(win => expect(win.localStorage.getItem(HIDE_EXISTING_KEY)).to.equal('false'));

    cy.reload();
    cy.wait(['@getIntegration', '@getDiscoveredDevices']);
    cardTitles().should('have.length', 3);

    // turned back on
    cy.contains('label', 'integration.externalIntegration.discover.hideExistingDevices').click();
    cardTitles().should('have.length', 2);
    cy.window().then(win => expect(win.localStorage.getItem(HIDE_EXISTING_KEY)).to.equal('true'));
  });

  it('says so when every discovered device is hidden', () => {
    cy.intercept('GET', `**/api/v1/external_integration/${SELECTOR}/discovered_device`, [DISCOVERED_DEVICES[1]]).as(
      'getOnlyAdded'
    );
    cy.visit(DISCOVER_PAGE_URL, {
      onBeforeLoad: win => win.localStorage.removeItem(HIDE_EXISTING_KEY)
    });
    cy.wait(['@getIntegration', '@getOnlyAdded']);
    cardTitles().should('have.length', 0);
    cy.contains('integration.externalIntegration.discover.allDevicesHidden').should('exist');
    cy.contains('integration.externalIntegration.discover.noSearchResults').should('not.exist');
  });
});
