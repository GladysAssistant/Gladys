// An integration can publish the label of a supported option in several
// languages ({ en, fr, de, es }): the core keeps them in label_translations,
// stores the English text in label, and the dashboard shows the user's
// language. The device goes through the real API (validation, storage and the
// device API answer); only its states are stubbed, a read-only text feature
// having no way to receive one from the example service.
describe('Dashboard Devices Box multi-language option labels', () => {
  const serverUrl = Cypress.env('serverUrl');

  const AIR_QUALITY = 'homecoach-air-quality';
  const NOISE_LEVEL = 'homecoach-noise-level';
  const readOnlySelect = (name, selector, supportedOptions) => ({
    name,
    category: 'text',
    type: 'select',
    external_id: selector,
    selector,
    read_only: true,
    keep_history: false,
    has_feedback: false,
    min: 0,
    max: 0,
    supported_options: supportedOptions
  });

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
        boxes: [[{ type: 'devices', name: 'Home Coach', device_features: [AIR_QUALITY, NOISE_LEVEL] }], [], []]
      }
    });

    cy.createDevice(
      {
        name: 'Home Coach',
        external_id: 'homecoach',
        selector: 'homecoach',
        features: [
          readOnlySelect('Air quality', AIR_QUALITY, [
            { value: 'healthy', label: { en: 'Healthy', fr: 'Sain', de: 'Gesund', es: 'Saludable' } },
            { value: 'fine', label: { en: 'Fine', fr: 'Correct' } }
          ]),
          // a plain string label: the same text whatever the language
          readOnlySelect('Noise level', NOISE_LEVEL, [{ value: 'quiet', label: 'Quiet room' }])
        ]
      },
      'example'
    );

    // the states the integration would report
    const lastValues = { [AIR_QUALITY]: 'healthy', [NOISE_LEVEL]: 'quiet' };
    cy.intercept('GET', '**/api/v1/device?*', req => {
      req.continue(res => {
        res.body.forEach(device => {
          device.features.forEach(feature => {
            if (lastValues[feature.selector]) {
              feature.last_value_string = lastValues[feature.selector];
            }
          });
        });
      });
    }).as('getDevices');
  });

  // the user's language is set on the account itself, like a real user would,
  // and restored to the one the suite signed up with
  const setLanguage = language =>
    cy.request({
      method: 'PATCH',
      url: `${serverUrl}/api/v1/me`,
      body: { language }
    });

  afterEach(() => {
    setLanguage(Cypress.env('language'));
    cy.deleteDevices('example');
    cy.request({
      method: 'DELETE',
      url: `${serverUrl}/api/v1/dashboard/test`
    });
  });

  const row = name => cy.contains('tr', name);

  it('shows the label in the user language, with the plain label as fallback', () => {
    setLanguage('en');
    cy.visit('/dashboard/test');
    cy.wait('@getDevices')
      .its('response.body')
      .then(devices => {
        // the device API serves the translations next to the English label
        const option = devices[0].features
          .find(feature => feature.selector === AIR_QUALITY)
          .supported_options.find(supportedOption => supportedOption.value === 'healthy');
        expect(option.label).to.equal('Healthy');
        expect(option.label_translations).to.deep.equal({
          en: 'Healthy',
          fr: 'Sain',
          de: 'Gesund',
          es: 'Saludable'
        });
      });

    row('Air quality').should('contain', 'Healthy');
    row('Noise level').should('contain', 'Quiet room');
  });

  it('switches to the French label for a French-speaking user', () => {
    setLanguage('fr');
    cy.visit('/dashboard/test');
    cy.wait('@getDevices');

    row('Air quality')
      .should('contain', 'Sain')
      .and('not.contain', 'Healthy');
    // no translation: the plain label stays
    row('Noise level').should('contain', 'Quiet room');
  });
});
