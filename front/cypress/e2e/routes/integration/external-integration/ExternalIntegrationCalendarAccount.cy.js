// The per-user "My calendars" block of a calendar integration
// (docs/specs/external-integrations/capabilities/calendar-type.md). The
// integration and its account routes are stubbed (it would need an installed
// Docker container), everything else is the real app — the shared form engine
// and the request sent to the server.
const SELECTOR = 'ext-dev-holidays';
const CONFIG_URL = `/dashboard/integration/device/external/${SELECTOR}/config`;
const ACCOUNT_URL = `**/api/v1/external_integration/${SELECTOR}/calendar/account`;
// cy.contains matches substrings ("Save configuration"): button checks stay
// inside the "My calendars" card
const myCalendarsCard = () => cy.contains('.card', 'integration.externalIntegration.myCalendars.title');

const buildIntegration = accountSchema => ({
  id: '6c1b3f0e-2a4d-4b8e-9f3a-1d2c3b4a5e02',
  name: 'Holidays',
  selector: SELECTOR,
  type: 'external',
  status: 'RUNNING',
  running: true,
  version: '1.0.0',
  granted_devices: [],
  manifest: {
    name: 'Holidays',
    type: 'calendar',
    version: '1.0.0',
    ...(accountSchema ? { account_schema: accountSchema } : {})
  }
});

describe('External integration - My calendars', () => {
  beforeEach(() => {
    cy.login();
    cy.intercept('GET', `**/api/v1/external_integration/${SELECTOR}/config`, {
      config: {},
      configured_secrets: []
    });
  });

  it('starts the form from the account_schema defaults and sends them on Enable', () => {
    cy.intercept(
      'GET',
      `**/api/v1/external_integration/${SELECTOR}`,
      buildIntegration([
        {
          key: 'include_holidays',
          type: 'boolean',
          label: { en: 'Include public holidays' },
          default: true
        },
        { key: 'country', type: 'string', label: { en: 'Country' }, default: 'FR' }
      ])
    ).as('getIntegration');
    cy.intercept('GET', ACCOUNT_URL, {
      enabled: false,
      config: {},
      configured_secrets: [],
      calendars: []
    }).as('getAccount');
    cy.intercept('POST', ACCOUNT_URL, req => {
      req.reply({ enabled: true, config: req.body.config, configured_secrets: [], calendars: [] });
    }).as('enableAccount');

    cy.visit(CONFIG_URL);
    cy.wait('@getIntegration');
    cy.wait('@getAccount');

    cy.get('#config_include_holidays').should('be.checked');
    cy.get('#config_country').should('have.value', 'FR');

    myCalendarsCard().within(() => {
      cy.contains('button', 'integration.externalIntegration.myCalendars.enableButton').click();
    });

    cy.wait('@enableAccount').then(({ request }) => {
      expect(request.body.config).to.deep.equal({ include_holidays: true, country: 'FR' });
    });
    myCalendarsCard().within(() => {
      cy.contains('button', 'integration.externalIntegration.myCalendars.saveButton').should('exist');
    });
  });

  it('shows no Save button on an enabled account with nothing to fill in', () => {
    cy.intercept('GET', `**/api/v1/external_integration/${SELECTOR}`, buildIntegration(null)).as('getIntegration');
    cy.intercept('GET', ACCOUNT_URL, {
      enabled: true,
      config: {},
      configured_secrets: [],
      calendars: []
    }).as('getAccount');

    cy.visit(CONFIG_URL);
    cy.wait('@getIntegration');
    cy.wait('@getAccount');

    myCalendarsCard().within(() => {
      cy.contains('button', 'integration.externalIntegration.myCalendars.disableButton').should('exist');
      cy.contains('button', 'integration.externalIntegration.myCalendars.saveButton').should('not.exist');
      cy.contains('button', 'integration.externalIntegration.myCalendars.enableButton').should('not.exist');
    });
  });
});
