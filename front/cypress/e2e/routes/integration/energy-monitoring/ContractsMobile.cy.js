// Energy monitoring on a phone (docs/specs/mobile-pages/energy.md): the contracts as rows, the
// contract wizard as a flow in steps, the meter of a device chosen in a sheet, the settings.
describe('Energy monitoring on a phone', () => {
  const serverUrl = Cypress.env('serverUrl');
  const BASE = '/dashboard/integration/device/energy-monitoring';
  const energyDevice = (name, selector) => ({
    name,
    external_id: selector,
    selector,
    features: [
      {
        name: `${name} index`,
        category: 'energy-sensor',
        type: 'index',
        external_id: `${selector}-index`,
        selector: `${selector}-index`,
        unit: 'kWh',
        read_only: true,
        keep_history: true,
        has_feedback: false,
        min: 0,
        max: 1000000
      }
    ]
  });
  const METER_SELECTOR = 'cypress-phone-meter';
  const PLUG_SELECTOR = 'cypress-phone-plug';
  const TARIFF = {
    tariff_version: 1,
    components: [{ key: 'energy', kind: 'consumption', rules: [], fallback: { price: 0.2 } }]
  };
  const TEMPLATE = {
    key: 'cypress-peak-off-peak',
    name: { en: 'Cypress peak / off-peak' },
    country: 'FR',
    currency: 'EUR',
    pricing_mode: 'rules',
    version: '2026-01-01',
    provider: { kind: 'community', name: 'community', running: true }
  };
  const TEMPLATE_DETAIL = {
    ...TEMPLATE,
    inputs: [
      { key: 'peak_price', type: 'number', unit: 'EUR/kWh', label: { en: 'Peak price' }, default: 0.25 },
      { key: 'off_peak_hours', type: 'time_intervals', label: { en: 'Off-peak hours' }, default: [['22:00', '06:00']] }
    ],
    tariff: TARIFF
  };

  const deleteContracts = () =>
    cy.request({ method: 'GET', url: `${serverUrl}/api/v1/energy_contract` }).then(res => {
      cy.wrap(res.body).each(contract =>
        cy.request({ method: 'DELETE', url: `${serverUrl}/api/v1/energy_contract/${contract.selector}` })
      );
    });
  const deleteDevice = selector =>
    cy.request({ method: 'DELETE', url: `${serverUrl}/api/v1/device/${selector}`, failOnStatusCode: false });

  // the meter, then the template step
  const startWizardOnTemplateStep = () => {
    cy.visit(`${BASE}/contracts/create`);
    cy.contains('[data-cy=energy-contract-meter-row]', 'Cypress phone meter').click();
    cy.get('[data-cy=energy-contract-next]').click();
    cy.get('[data-cy=energy-contract-step-template]').should('exist');
  };

  before(() => {
    cy.login();
    deleteContracts();
    deleteDevice(METER_SELECTOR);
    deleteDevice(PLUG_SELECTOR);
    cy.createDevice(energyDevice('Cypress phone meter', METER_SELECTOR), 'example');
    cy.createDevice(energyDevice('Cypress phone plug', PLUG_SELECTOR), 'example');
  });

  beforeEach(() => {
    cy.login();
    cy.viewport('iphone-x');
    // the community catalogue is fetched from GitHub on a real instance: stub it out
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/energy_contract/template` }, { body: [] });
  });

  after(() => {
    cy.login();
    deleteContracts();
    deleteDevice(METER_SELECTOR);
    deleteDevice(PLUG_SELECTOR);
  });

  it('should show the contracts as a list, empty at first, with a floating button', () => {
    cy.visit(`${BASE}/contracts`);
    cy.get('[data-cy=energy-contracts-mobile]').should('exist');
    cy.get('[data-cy=energy-contract-empty]').i18n('integration.energyMonitoring.contracts.empty');
    cy.get('[data-cy=energy-contract-create]').should('be.visible');
    // a consultation page keeps the chrome of the integration
    cy.get('.hz-subpage-chrome').should('be.visible');
  });

  it('should create a manual contract step by step', () => {
    cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/energy_contract` }).as('createContract');
    cy.visit(`${BASE}/contracts`);
    cy.get('[data-cy=energy-contract-create]').click();

    // step 1: the meter, in a focus page
    cy.get('[data-cy=energy-contract-wizard-mobile]').should('exist');
    cy.get('.hz-subpage-chrome').should('not.be.visible');
    cy.get('[data-cy=mobile-steps-label]').i18n('integration.energyMonitoring.contracts.wizard.meter');
    cy.get('[data-cy=energy-contract-next]').should('be.disabled');
    cy.contains('[data-cy=energy-contract-meter-row]', 'Cypress phone meter').click();
    cy.contains('[data-cy=energy-contract-meter-row]', 'Cypress phone meter').should(
      'have.attr',
      'aria-checked',
      'true'
    );
    cy.get('[data-cy=energy-contract-next]').click();

    // step 2: the template, here a contract typed by hand
    cy.get('[data-cy=mobile-steps-label]').i18n('integration.energyMonitoring.contracts.wizard.template');
    cy.get('[data-cy=energy-contract-no-template]').should('exist');
    cy.get('[data-cy=energy-contract-manual]').click();

    // step 3: the parameters
    cy.get('[data-cy=mobile-steps-label]').i18n('integration.energyMonitoring.contracts.wizard.parameters');
    cy.get('[data-cy=energy-contract-preview]').should('be.disabled');
    cy.get('[data-cy=energy-contract-name]').should('have.css', 'font-size', '16px');
    cy.get('[data-cy=energy-contract-name]').type('Phone flat rate');
    cy.get('[data-cy=energy-contract-valid-from]').clear();
    cy.get('[data-cy=energy-contract-valid-from]').type('2025-01-01');
    cy.get('[data-cy=energy-contract-tariff-json]').should('contain.value', '"tariff_version": 1');
    cy.get('[data-cy=energy-contract-tariff-json]').should('have.css', 'font-size', '16px');
    // the billing settings sit behind a row, in a sheet
    cy.get('[data-cy=energy-contract-billing-row]').click();
    cy.get('[data-cy=energy-contract-billing-sheet]').should('be.visible');
    cy.get('[data-cy=energy-contract-billing-day]').clear();
    cy.get('[data-cy=energy-contract-billing-day]').type('5');
    cy.get('[data-cy=energy-contract-power]').type('9');
    cy.get('[data-cy=energy-contract-billing-sheet] [data-cy=sheet-ok]').click();
    cy.get('[data-cy=energy-contract-billing-row]').should('contain', '9 kVA');
    cy.get('[data-cy=energy-contract-preview]').click();

    // step 4: the preview, then the save
    cy.get('[data-cy=mobile-steps-label]').i18n('integration.energyMonitoring.contracts.wizard.preview');
    cy.get('[data-cy=energy-contract-preview-result]').should('exist');
    cy.get('[data-cy=energy-contract-preview-total]').should('not.be.empty');
    cy.get('[data-cy=energy-contract-preview-components]').should('contain', 'subscription');
    cy.get('[data-cy=energy-contract-save]').click();
    cy.wait('@createContract').then(({ request, response }) => {
      expect(response.statusCode).to.eq(201);
      expect(request.body.name).to.eq('Phone flat rate');
      expect(request.body.valid_from).to.eq('2025-01-01');
      expect(request.body.valid_to).to.eq(null);
      expect(request.body.billing_period_start_day).to.eq(5);
      expect(request.body.subscribed_power).to.eq(9);
      expect(request.body.power_unit).to.eq('kVA');
      expect(request.body.pricing_mode).to.eq('rules');
      expect(request.body.provider_kind).to.eq('user');
      expect(request.body.tariff.tariff_version).to.eq(1);
    });

    // back on the list: the contract is a row under its meter
    cy.get('[data-cy=energy-contracts-mobile]').should('exist');
    cy.get('[data-cy=energy-contract-row]').should('have.length', 1);
    cy.get('[data-cy=energy-contract-row]').should('contain', 'Phone flat rate');
    cy.get('[data-cy=energy-contract-meter]').should('contain', 'Cypress phone meter');
    cy.get('[data-cy=energy-contract-status]').i18n('integration.energyMonitoring.contracts.status.active');
  });

  it('should pick a template and its time ranges with two lists', () => {
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/energy_contract/template` }, { body: [TEMPLATE] });
    cy.intercept(
      { method: 'GET', url: `${serverUrl}/api/v1/energy_contract/template/community/cypress-peak-off-peak*` },
      { body: TEMPLATE_DETAIL }
    );
    cy.intercept(
      { method: 'POST', url: `${serverUrl}/api/v1/energy_contract/preview` },
      {
        body: {
          total: 12.5,
          kwh: 50,
          intervals: 336,
          components: { energy: 12.5 },
          warnings: {},
          synthetic: false,
          samples: [{ starts_at: '2026-01-01T00:00:00.000Z', kwh: 0.5, unit_price: 0.25, cost: 0.125, label: 'peak' }]
        }
      }
    ).as('preview');
    startWizardOnTemplateStep();

    // the search narrows the rows
    cy.get('[data-cy=energy-contract-template-row]').should('have.length', 1);
    cy.get('[data-cy=energy-contract-template-search]').type('nothing like it');
    cy.get('[data-cy=energy-contract-template-row]').should('not.exist');
    cy.get('[data-cy=energy-contract-template-search]').clear();
    cy.get('[data-cy=energy-contract-template-row]').click();

    cy.get('[data-cy=energy-contract-selected-template]').should('contain', 'Cypress peak / off-peak');
    cy.get('[data-cy=energy-contract-name]').should('have.value', 'Cypress peak / off-peak');
    // the range of the template, then one added from the sheet
    cy.get('[data-cy=hour-range-row]').should('have.length', 1);
    cy.get('[data-cy=hour-range-row]').should('contain', '22:00 → 06:00');
    cy.get('[data-cy=hour-range-add]').click();
    cy.get('[data-cy=hour-range-sheet]').should('be.visible');
    cy.get('[data-cy=hour-range-start]').select('12:00');
    cy.get('[data-cy=hour-range-end]').select('12:00');
    cy.get('[data-cy=hour-range-validate]').should('be.disabled');
    cy.get('[data-cy=hour-range-end]').select('14:00');
    cy.get('[data-cy=hour-range-validate]').click();
    cy.get('[data-cy=hour-range-row]').should('have.length', 2);
    // a range touching another one is merged with it
    cy.get('[data-cy=hour-range-add]').click();
    cy.get('[data-cy=hour-range-start]').select('14:00');
    cy.get('[data-cy=hour-range-end]').select('15:30');
    cy.get('[data-cy=hour-range-validate]').click();
    cy.get('[data-cy=hour-range-row]').should('have.length', 2);
    cy.get('[data-cy=hour-range-row]')
      .first()
      .should('contain', '12:00 → 15:30');
    // a range is removed from its row
    cy.get('[data-cy=hour-range-remove]')
      .last()
      .click();
    cy.get('[data-cy=hour-range-row]').should('have.length', 1);

    cy.get('[data-cy=energy-contract-preview]').click();
    cy.wait('@preview').then(({ request }) => {
      expect(request.body.inputs.off_peak_hours).to.deep.eq([['12:00', '15:30']]);
      expect(request.body.inputs.peak_price).to.eq(0.25);
    });
    cy.get('[data-cy=energy-contract-preview-samples]').should('contain', 'peak');
  });

  it('should ask before leaving a contract that is not saved', () => {
    cy.visit(`${BASE}/contracts/create`);
    // nothing to lose yet: the back control leaves at once
    cy.get('[data-cy=mobile-nav-back]').i18n('integration.energyMonitoring.contracts.tab');
    cy.get('[data-cy=mobile-nav-back]').click();
    cy.location('pathname').should('eq', `${BASE}/contracts`);

    startWizardOnTemplateStep();
    cy.get('[data-cy=energy-contract-manual]').click();
    cy.get('[data-cy=energy-contract-name]').type('Never saved');
    cy.get('[data-cy=mobile-nav-back]').click();
    cy.get('[data-cy=energy-contract-leave-confirm]').should('be.visible');
    cy.get('[data-cy=confirm-sheet-cancel]').click();
    cy.get('[data-cy=energy-contract-leave-confirm]').should('not.exist');
    cy.get('[data-cy=energy-contract-name]').should('have.value', 'Never saved');

    cy.get('[data-cy=mobile-nav-back]').click();
    cy.get('[data-cy=confirm-sheet-confirm]').click();
    cy.location('pathname').should('eq', `${BASE}/contracts`);
    cy.get('[data-cy=energy-contract-row]').should('have.length', 1);
  });

  it('should show a refused save in the bottom bar', () => {
    startWizardOnTemplateStep();
    cy.get('[data-cy=energy-contract-manual]').click();
    cy.get('[data-cy=energy-contract-name]').type('Overlapping');
    cy.get('[data-cy=energy-contract-preview]').click();
    cy.get('[data-cy=energy-contract-preview-result]').should('exist');
    cy.get('[data-cy=energy-contract-save]').click();
    cy.get('[data-cy=energy-contract-bottom-bar] [data-cy=energy-contract-save-error]').should(
      'contain',
      'already covers'
    );
    // the step before is one tap away, with what was typed
    cy.get('[data-cy=energy-contract-back]').click();
    cy.get('[data-cy=energy-contract-name]').should('have.value', 'Overlapping');
  });

  it('should open a contract from its row and save its new name', () => {
    cy.intercept({ method: 'PATCH', url: `${serverUrl}/api/v1/energy_contract/*` }).as('updateContract');
    cy.visit(`${BASE}/contracts`);
    cy.get('[data-cy=energy-contract-open]').click();
    cy.get('[data-cy=energy-contract-wizard-mobile]').should('exist');
    cy.get('[data-cy=mobile-steps-label]').i18n('integration.energyMonitoring.contracts.wizard.parameters');
    cy.get('[data-cy=energy-contract-name]').should('have.value', 'Phone flat rate');
    cy.get('[data-cy=energy-contract-json-mode]').should('have.attr', 'aria-checked', 'true');
    // an edited contract keeps its meter and its template: no way back to those steps
    cy.get('[data-cy=energy-contract-back]').should('not.exist');
    cy.get('[data-cy=energy-contract-name]').clear();
    cy.get('[data-cy=energy-contract-name]').type('Phone flat rate 2025');
    cy.get('[data-cy=energy-contract-preview]').click();
    cy.get('[data-cy=energy-contract-preview-result]').should('exist');
    cy.get('[data-cy=energy-contract-save]').click();
    cy.wait('@updateContract')
      .its('request.body.name')
      .should('eq', 'Phone flat rate 2025');
    cy.get('[data-cy=energy-contract-row]').should('contain', 'Phone flat rate 2025');
  });

  it('should choose the meter of a device in a sheet', () => {
    cy.intercept({ method: 'PATCH', url: `${serverUrl}/api/v1/device/${PLUG_SELECTOR}/electric_meter` }).as('attach');
    cy.visit(BASE);
    cy.get('[data-cy=energy-devices-mobile]').should('exist');
    cy.get('[data-cy=energy-meter-card]').should('contain', 'Cypress phone meter');
    cy.get('[data-cy=energy-device-meter-badge]').should('exist');
    cy.contains('[data-cy=energy-unattached-card] [data-cy=energy-device-row]', 'Cypress phone plug').i18n(
      'integration.energyMonitoring.hierarchy.chooseMeter'
    );
    cy.contains('[data-cy=energy-unattached-card] [data-cy=energy-device-row]', 'Cypress phone plug').click();
    cy.get('[data-cy=energy-device-meter-sheet]').should('be.visible');
    cy.contains('[data-cy=energy-device-meter-option]', 'Cypress phone meter').click();
    cy.wait('@attach')
      .its('response.statusCode')
      .should('eq', 200);
    cy.get('[data-cy=energy-device-meter-sheet]').should('not.exist');
    cy.get('[data-cy=energy-meter-card]').should('contain', 'Cypress phone plug');
    cy.get('[data-cy=energy-device-toast]').should('contain', 'Cypress phone plug');
  });

  it('should delete a contract from its actions, once confirmed', () => {
    cy.intercept({ method: 'DELETE', url: `${serverUrl}/api/v1/energy_contract/*` }).as('deleteContract');
    cy.visit(`${BASE}/contracts`);
    cy.get('[data-cy=energy-contract-actions]').click();
    cy.get('[data-cy=energy-contract-actions-sheet]').should('be.visible');
    cy.get('[data-cy=energy-contract-delete]').click();
    cy.get('[data-cy=energy-contract-delete-confirm]').should('be.visible');
    cy.get('[data-cy=confirm-sheet-cancel]').click();
    cy.get('[data-cy=energy-contract-row]').should('have.length', 1);

    cy.get('[data-cy=energy-contract-actions]').click();
    cy.get('[data-cy=energy-contract-delete]').click();
    cy.get('[data-cy=confirm-sheet-confirm]').click();
    cy.wait('@deleteContract')
      .its('response.statusCode')
      .should('eq', 200);
    cy.get('[data-cy=energy-contract-empty]').should('exist');
    cy.get('[data-cy=energy-contract-deleted-toast]').i18n('integration.energyMonitoring.mobile.contractDeleted');
  });

  it('should confirm a recalculation and show the calendars as rows', () => {
    cy.intercept(
      { method: 'GET', url: `${serverUrl}/api/v1/energy_calendar` },
      {
        body: [
          {
            key: 'cypress-colours',
            granularity: 'day',
            first_at: '2026-01-01T00:00:00.000Z',
            last_at: '2026-01-31T00:00:00.000Z',
            provider_service: null
          }
        ]
      }
    );
    cy.intercept(
      { method: 'GET', url: `${serverUrl}/api/v1/energy_calendar/cypress-colours*` },
      { body: [{ starts_at: '2026-01-31T00:00:00.000Z', value: 'blue' }] }
    );
    cy.intercept(
      { method: 'POST', url: `${serverUrl}/api/v1/service/energy-monitoring/calculate-cost-from-beginning` },
      cy.spy().as('calculateCost')
    );
    cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/energy_contract/recalculate` }, { body: {} }).as(
      'recalculate'
    );
    cy.visit(`${BASE}/settings`);
    cy.get('[data-cy=energy-settings-mobile]').should('exist');

    // a recalculation is explained and confirmed before it starts
    cy.get('[data-cy=energy-calculate-cost]').click();
    cy.get('[data-cy=energy-calculate-confirm]').i18n(
      'integration.energyMonitoring.calculateCostFromBeginningDescription'
    );
    cy.get('[data-cy=confirm-sheet-cancel]').click();
    cy.get('[data-cy=energy-calculate-confirm]').should('not.exist');
    cy.get('@calculateCost').should('not.have.been.called');

    // a calendar is a row, its last values a sheet
    cy.get('[data-cy=energy-calendar-row]').should('contain', 'cypress-colours');
    cy.get('[data-cy=energy-calendar-row]').i18n('integration.energyMonitoring.contracts.calendars.orphaned');
    cy.get('[data-cy=energy-calendar-row]').click();
    cy.get('[data-cy=energy-calendar-sheet]').should('contain', 'blue');
    cy.get('[data-cy=energy-calendar-sheet] [data-cy=sheet-close]').click();

    cy.get('[data-cy=energy-recalculate]').should('be.disabled');
    cy.get('[data-cy=energy-recalculate-from]').type('2026-01-01');
    cy.get('[data-cy=energy-recalculate]').click();
    cy.wait('@recalculate')
      .its('request.body.from')
      .should('eq', '2026-01-01');
    cy.get('[data-cy=energy-recalculated]').should('exist');
  });

  it('should keep the card of the wizard on a wider screen', () => {
    cy.viewport(1280, 800);
    cy.visit(`${BASE}/contracts/create`);
    cy.get('[data-cy=energy-contract-meter]').should('exist');
    cy.get('[data-cy=energy-contract-wizard-mobile]').should('not.exist');
    cy.get('.hz-subpage-chrome').should('be.visible');
  });
});
