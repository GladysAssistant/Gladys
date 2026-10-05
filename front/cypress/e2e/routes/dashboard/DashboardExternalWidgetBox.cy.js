// Integration widget on the dashboard (docs/specs/external-integrations/
// capabilities/dashboard-widgets.md). The integration itself is stubbed (it
// would need an installed Docker container): the widget list and the content
// route are intercepted, everything else is the real app — the editor, the
// picker tile, the settings form, the card and its states.
const SELECTOR = 'ext-dev-roborock';
const WIDGET_KEY = 'vacuum';

const buildWidget = status => ({
  integration_selector: SELECTOR,
  integration_name: 'Roborock Demo',
  integration_status: status,
  key: WIDGET_KEY,
  label: { en: 'Vacuum', fr: 'Aspirateur' },
  description: { en: 'State of the robot.' },
  icon: 'wind',
  settings: [
    {
      key: 'mode',
      type: 'select',
      label: { en: 'Display mode' },
      default: 'compact',
      options: [
        { value: 'compact', label: { en: 'Compact' } },
        { value: 'full', label: { en: 'Full' } }
      ]
    }
  ]
});

const CONTENT = {
  expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  content: {
    version: 1,
    components: [
      // declared out of order on purpose: the card imposes the canonical slots
      { type: 'button', label: 'Start', style: 'primary', action: { key: 'start', params: {}, confirm: false } },
      { type: 'status', items: [{ label: 'State', value: 'Docked', color: 'success' }] },
      { type: 'value', value: 82, unit: '%', label: 'Battery', icon: 'battery' },
      { type: 'text', variant: 'heading', text: 'Living room' }
    ]
  }
};

const CONTENT_URL = `**/api/v1/external_integration/${SELECTOR}/widget/${WIDGET_KEY}/content*`;

const createDashboard = boxes =>
  cy
    .request({
      method: 'POST',
      url: `${Cypress.env('serverUrl')}/api/v1/dashboard`,
      body: {
        name: 'Widget test',
        type: 'main',
        visibility: 'private',
        boxes: [{ columns: [boxes, [], []] }]
      }
    })
    .its('body.selector');

describe('Dashboard integration widget box', () => {
  let dashboardSelector;

  beforeEach(() => {
    cy.login();
  });

  afterEach(() => {
    if (dashboardSelector) {
      cy.request({
        method: 'DELETE',
        url: `${Cypress.env('serverUrl')}/api/v1/dashboard/${dashboardSelector}`
      });
      dashboardSelector = null;
    }
  });

  it('lists the widget in the picker, renders its settings form and the canonical slots', () => {
    cy.intercept('GET', '**/api/v1/external_integration/widget', [buildWidget('RUNNING')]).as('getWidgets');
    cy.intercept('GET', CONTENT_URL, CONTENT).as('getContent');
    createDashboard([]).then(selector => {
      dashboardSelector = selector;
      cy.visit(`/dashboard/${selector}/edit`);
    });
    cy.contains('.btn-primary', 'dashboard.addBoxButton').click();
    cy.wait('@getWidgets');
    // the tile comes after the core tiles, under its own heading, with the
    // integration as caption
    cy.get('[data-cy="select-box-type-integrations"]').i18n('dashboard.selectBoxTypeIntegrationSection');
    cy.get(`[data-cy="box-type-external-widget-${SELECTOR}-${WIDGET_KEY}"]`)
      .should('contain', 'Vacuum')
      .and('contain', 'Roborock Demo')
      .click();
    // the settings form is the shared config_schema engine
    cy.get('[data-cy="external-widget-settings"] select').select('full');
    cy.get('[data-cy="external-widget-name"]').type('Robot');
    // the card renders live in the editor canvas, in the canonical order:
    // header, tiles, status, buttons — whatever the order of the content
    // the card may have pulled once with the default setting before the
    // select: the last pull carries the chosen one
    cy.wait('@getContent');
    cy.get('@getContent.all').should(calls => {
      expect(decodeURIComponent(calls[calls.length - 1].request.url)).to.include('"mode":"full"');
    });
    cy.get('[data-cy="external-widget-box"]').within(() => {
      cy.contains('Robot');
      cy.contains('Living room');
      cy.contains('Battery');
      cy.contains('Docked');
      cy.get('[data-cy="external-widget-action-start"]').should('exist');
      cy.get('[data-cy="external-widget-action-start"]').then($button => {
        cy.contains('Living room').then($heading => {
          expect($heading[0].compareDocumentPosition($button[0]) & Node.DOCUMENT_POSITION_FOLLOWING).to.be.ok;
        });
      });
    });
    cy.intercept('PATCH', '**/api/v1/dashboard/*').as('saveDashboard');
    cy.contains('.btn-outline-primary', 'dashboard.editDashboardSaveButton').click();
    cy.wait('@saveDashboard')
      .its('request.body.boxes.0.columns.0.0')
      .should('deep.equal', {
        type: 'external-widget',
        integration: SELECTOR,
        widget: WIDGET_KEY,
        name: 'Robot',
        settings: { mode: 'full' }
      });
  });

  it('shows a stopped integration as stopped, without fetching any content', () => {
    cy.intercept('GET', '**/api/v1/external_integration/widget', [buildWidget('STOPPED')]).as('getWidgets');
    cy.intercept('GET', CONTENT_URL, cy.spy().as('contentRequest'));
    createDashboard([{ type: 'external-widget', integration: SELECTOR, widget: WIDGET_KEY }]).then(selector => {
      dashboardSelector = selector;
      cy.visit(`/dashboard/${selector}`);
    });
    cy.wait('@getWidgets');
    cy.get('[data-cy="external-widget-state"]').i18n('dashboard.boxes.external-widget.stopped');
    cy.get('@contentRequest').should('not.have.been.called');
  });

  it('shows the not-installed, settings, unavailable and newer-Gladys states', () => {
    cy.intercept('GET', '**/api/v1/external_integration/widget', []).as('getWidgets');
    createDashboard([{ type: 'external-widget', integration: SELECTOR, widget: WIDGET_KEY }]).then(selector => {
      dashboardSelector = selector;
      cy.visit(`/dashboard/${selector}`);
    });
    cy.wait('@getWidgets');
    cy.get('[data-cy="external-widget-state"]').i18n('dashboard.boxes.external-widget.notInstalled');

    cy.intercept('GET', '**/api/v1/external_integration/widget', [buildWidget('RUNNING')]).as('getWidgetsRunning');
    cy.intercept('GET', CONTENT_URL, { statusCode: 422, body: { properties: 'settings.mode: must be one of' } }).as(
      'getContent422'
    );
    cy.reload();
    cy.wait('@getContent422');
    cy.get('[data-cy="external-widget-state"]').i18n('dashboard.boxes.external-widget.checkSettings');
    cy.get('[data-cy="external-widget-state"]').should('contain', 'settings.mode');

    cy.intercept('GET', CONTENT_URL, {
      statusCode: 400,
      body: { message: 'REQUEST_TO_THIRD_PARTY_FAILED', error: 'API key invalid' }
    }).as('getContent400');
    cy.reload();
    cy.wait('@getContent400');
    cy.get('[data-cy="external-widget-state"]').i18n('dashboard.boxes.external-widget.unavailable');
    cy.get('[data-cy="external-widget-state"]').should('contain', 'API key invalid');

    cy.intercept('GET', CONTENT_URL, {
      statusCode: 400,
      body: { message: 'WIDGET_CONTENT_VERSION_UNSUPPORTED' }
    }).as('getContentVersion');
    cy.reload();
    cy.wait('@getContentVersion');
    cy.get('[data-cy="external-widget-state"]').i18n('dashboard.boxes.external-widget.needsNewerGladys');
  });

  it('posts a widget action and shows the integration message', () => {
    cy.intercept('GET', '**/api/v1/external_integration/widget', [buildWidget('DEGRADED')]).as('getWidgets');
    cy.intercept('GET', CONTENT_URL, CONTENT).as('getContent');
    cy.intercept('POST', `**/api/v1/external_integration/${SELECTOR}/widget/${WIDGET_KEY}/action/start`, {
      message: { en: 'Cleaning started' }
    }).as('runAction');
    createDashboard([{ type: 'external-widget', integration: SELECTOR, widget: WIDGET_KEY }]).then(selector => {
      dashboardSelector = selector;
      cy.visit(`/dashboard/${selector}`);
    });
    // a degraded integration still serves content, with its badge on the card
    cy.wait('@getWidgets');
    cy.wait('@getContent');
    cy.get('[data-cy="external-widget-box"]').i18n('integration.externalIntegration.status.DEGRADED');
    cy.get('[data-cy="external-widget-action-start"]').click();
    cy.wait('@runAction')
      .its('request.body')
      .should('deep.equal', { settings: {} });
    cy.get('[data-cy="external-widget-action-message"]').should('contain', 'Cleaning started');
  });

  it('opens the form of an action declaring fields, posts the typed values and shows a refused value', () => {
    const delivery = {
      type: 'button',
      label: 'Pallet delivered',
      icon: 'truck',
      action: {
        key: 'delivery',
        params: {},
        confirm: false,
        fields: [
          { key: 'bags', type: 'number', required: true, min: 1, max: 200, default: 72, label: { en: 'Bags' } },
          { key: 'price_per_bag', type: 'number', required: true, min: 0, default: 7.3, label: { en: 'Price per bag' } }
        ]
      }
    };
    const start = { type: 'button', label: 'Start', action: { key: 'start', params: {}, confirm: false } };
    const formContent = { ...CONTENT, content: { version: 1, components: [delivery, start] } };
    const actionUrl = `**/api/v1/external_integration/${SELECTOR}/widget/${WIDGET_KEY}/action/delivery`;
    cy.intercept('GET', '**/api/v1/external_integration/widget', [buildWidget('RUNNING')]).as('getWidgets');
    cy.intercept('GET', CONTENT_URL, formContent).as('getContent');
    cy.intercept('POST', actionUrl, {
      statusCode: 422,
      body: { properties: 'values.price_per_bag: must be <= 50' }
    }).as('refusedAction');
    createDashboard([{ type: 'external-widget', integration: SELECTOR, widget: WIDGET_KEY }]).then(selector => {
      dashboardSelector = selector;
      cy.visit(`/dashboard/${selector}`);
    });
    cy.wait('@getWidgets');
    cy.wait('@getContent');
    cy.intercept('POST', `**/api/v1/external_integration/${SELECTOR}/widget/${WIDGET_KEY}/action/start`, {
      message: null
    }).as('runStart');
    // nothing to type on the card at rest: the form opens on a tap, pre-filled
    cy.get('[data-cy="external-widget-action-form-delivery"]').should('not.exist');
    cy.get('[data-cy="external-widget-action-delivery"]').click();
    cy.get('[data-cy="external-widget-action-form-delivery"]').should('exist');
    // another action runs right away and closes the unrelated form
    cy.get('[data-cy="external-widget-action-start"]').click();
    cy.wait('@runStart');
    cy.get('[data-cy="external-widget-action-form-delivery"]').should('not.exist');
    cy.get('[data-cy="external-widget-action-delivery"]').click();
    cy.get('[data-cy="external-widget-action-delivery"]').should('have.attr', 'aria-expanded', 'true');
    cy.get('[data-cy="external-widget-action-form-delivery"] input[id$="_bags"]').should('have.value', '72');
    cy.get('[data-cy="external-widget-action-form-delivery"] input[id$="_price_per_bag"]').should('have.value', '7.3');
    cy.get('[data-cy="external-widget-action-form-delivery"] input[id$="_price_per_bag"]').clear();
    cy.get('[data-cy="external-widget-action-form-delivery"] input[id$="_price_per_bag"]').type('60');
    cy.get('[data-cy="external-widget-action-form-delivery"] button[type="submit"]').click();
    cy.wait('@refusedAction')
      .its('request.body')
      .should('deep.equal', { settings: {}, values: { bags: 72, price_per_bag: 60 } });
    // the refusal of the core stays in the open form
    cy.get('[data-cy="external-widget-action-form-error"]').should('contain', 'values.price_per_bag: must be <= 50');
    cy.intercept('POST', actionUrl, { message: { en: '72 bags recorded' } }).as('runAction');
    // a decimal value is accepted by the number input
    cy.get('[data-cy="external-widget-action-form-delivery"] input[id$="_price_per_bag"]').clear();
    cy.get('[data-cy="external-widget-action-form-delivery"] input[id$="_price_per_bag"]').type('6.95');
    cy.get('[data-cy="external-widget-action-form-delivery"] button[type="submit"]').click();
    cy.wait('@runAction')
      .its('request.body')
      .should('deep.equal', { settings: {}, values: { bags: 72, price_per_bag: 6.95 } });
    cy.get('[data-cy="external-widget-action-form-delivery"]').should('not.exist');
    cy.get('[data-cy="external-widget-action-message"]').should('contain', '72 bags recorded');
  });
});
