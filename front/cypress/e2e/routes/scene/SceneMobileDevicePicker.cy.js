// The device fields of the scene forms on a phone (docs/specs/scene-editor-mobile.md, E.10): the
// selection reads as rows, and the device picker of the dashboard opens in a sheet above the
// step's one. Devices for an action on lights, features of one kind for a device state trigger.
describe('Scene device picker on a phone', () => {
  const serverUrl = Cypress.env('serverUrl');
  let sceneSelector;

  const feature = (selector, name, category, type, extra = {}) => ({
    name,
    selector,
    external_id: selector,
    category,
    type,
    read_only: false,
    keep_history: false,
    has_feedback: false,
    min: 0,
    max: 1,
    ...extra
  });

  beforeEach(() => {
    cy.viewport('iphone-x');
    cy.login();

    const { rooms } = Cypress.env('house');
    cy.request({
      method: 'GET',
      url: `${serverUrl}/api/v1/room/${rooms[0].selector}`
    }).then(res => {
      const device = (selector, name, features) =>
        cy.createDevice({ name, selector, external_id: selector, room_id: res.body.id, features }, 'example');
      device('picker-light-1', 'Picker light 1', [feature('picker-light-1-binary', 'On/off', 'light', 'binary')]);
      device('picker-light-2', 'Picker light 2', [feature('picker-light-2-binary', 'On/off', 'light', 'binary')]);
      device('picker-motion-1', 'Picker motion 1', [
        feature('picker-motion-1-motion', 'Motion', 'motion-sensor', 'binary', { read_only: true })
      ]);
      device('picker-motion-2', 'Picker motion 2', [
        feature('picker-motion-2-motion', 'Motion', 'motion-sensor', 'binary', { read_only: true }),
        feature('picker-motion-2-temperature', 'Temperature', 'temperature-sensor', 'decimal', {
          read_only: true,
          unit: 'celsius',
          min: -50,
          max: 100
        })
      ]);
    });

    cy.request({
      method: 'POST',
      url: `${serverUrl}/api/v1/scene`,
      body: {
        name: 'Picker scene',
        icon: 'zap',
        tags: [],
        triggers: [
          {
            type: 'device.new-state',
            device_features: ['picker-motion-1-motion'],
            operator: '=',
            value: 1
          }
        ],
        actions: [[{ type: 'light.turn-on', devices: ['picker-light-1'] }]]
      }
    }).then(res => {
      sceneSelector = res.body.selector;
    });
  });

  afterEach(() => {
    cy.request({ method: 'DELETE', url: `${serverUrl}/api/v1/scene/${sceneSelector}` });
    cy.deleteDevices('example');
  });

  it('Should pick the features of a trigger and the lights of an action in the picker sheet', () => {
    cy.intercept('PATCH', `${serverUrl}/api/v1/scene/*`).as('saveScene');
    cy.then(() => cy.visit(`/dashboard/scene/${sceneSelector}`));
    cy.get('[data-cy="scene-step-row-0.0"]').should('be.visible');

    // --- the trigger: features of one kind
    cy.get('[data-cy="scene-trigger-row-0"]').click();
    cy.get('[data-cy="scene-trigger-sheet-0"] [data-cy="device-picker-item-picker-motion-1-motion"]').should(
      'be.visible'
    );
    cy.get('[data-cy="scene-trigger-sheet-0"] [data-cy="device-picker-open"]').click();
    cy.get('[data-cy="device-picker-sheet"]').should('be.visible');
    // a motion sensor is selected: only the other motion sensors are listed
    cy.get('[data-cy="picker-same-kind-hint"]').should('be.visible');
    cy.get('[data-cy="picker-feature-picker-motion-2-motion"]').should('be.visible');
    cy.get('[data-cy="picker-feature-picker-motion-2-temperature"]').should('not.exist');
    cy.get('[data-cy="picker-feature-picker-light-1-binary"]').should('not.exist');
    cy.get('[data-cy="picker-feature-picker-motion-2-motion"]').click();
    cy.get('[data-cy="picker-validate"]').click();
    // back on the trigger's sheet, with both sensors
    cy.get('[data-cy="device-picker-sheet"]').should('not.exist');
    cy.get('[data-cy="scene-trigger-sheet-0"] [data-cy^="device-picker-item-"]').should('have.length', 2);
    // a sensor is removed from the field itself
    cy.get('[data-cy="scene-trigger-sheet-0"] [data-cy="device-picker-remove-picker-motion-1-motion"]').click();
    cy.get('[data-cy="scene-trigger-sheet-0"] [data-cy^="device-picker-item-"]').should('have.length', 1);
    cy.get('body').type('{esc}');

    // --- the action: devices, not features
    cy.get('[data-cy="scene-step-row-0.0"]').click();
    cy.get('[data-cy="scene-step-sheet-0.0"] [data-cy="device-picker-open"]').click();
    cy.get('[data-cy="picker-feature-picker-light-1"]').should('be.visible');
    cy.get('[data-cy="picker-feature-picker-motion-1"]').should('not.exist');
    // closing the picker keeps the selection as it was
    cy.get('[data-cy="picker-feature-picker-light-2"]').click();
    cy.get('body').type('{esc}');
    cy.get('[data-cy="device-picker-sheet"]').should('not.exist');
    cy.get('[data-cy="scene-step-sheet-0.0"] [data-cy^="device-picker-item-"]').should('have.length', 1);
    // validating applies it
    cy.get('[data-cy="scene-step-sheet-0.0"] [data-cy="device-picker-open"]').click();
    cy.get('[data-cy="picker-feature-picker-light-2"]').click();
    cy.get('[data-cy="picker-validate"]').click();
    cy.get('[data-cy="scene-step-sheet-0.0"] [data-cy^="device-picker-item-"]').should('have.length', 2);
    cy.get('body').type('{esc}');

    cy.get('[data-cy=scene-save-button]').click();
    cy.wait('@saveScene').then(({ request }) => {
      expect(request.body.triggers[0].device_features).to.deep.equal(['picker-motion-2-motion']);
      expect(request.body.actions[0][0].devices).to.deep.equal(['picker-light-1', 'picker-light-2']);
    });
    cy.get('[data-cy=scene-run-button]').should('be.visible');
  });

  it('Should keep the select on a wider screen', () => {
    cy.viewport(1280, 800);
    cy.then(() => cy.visit(`/dashboard/scene/${sceneSelector}`));
    cy.get('[data-cy=edit-scene-settings-button]').should('be.visible');
    cy.get('[data-cy="device-picker-open"]').should('not.exist');
    cy.get('.react-select__multi-value').should('exist');
  });
});
