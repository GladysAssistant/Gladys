// A device state trigger hands to the actions of the scene what fired it: the name of the device,
// the name of its feature, its new value and the previous one. The text fields list them, named
// after the trigger, and store them as {{triggerEvent.…}}. The devices are stubbed, the scenes
// are created and saved through the real server.
const LIVING_ROOM = { id: 'd63ce677-f5f8-47e1-816d-7aa227c863e4', name: 'Living Room', selector: 'living-room' };
const DEVICES = [
  {
    name: 'Front door',
    selector: 'front-door',
    room_id: LIVING_ROOM.id,
    room: LIVING_ROOM,
    features: [
      {
        name: 'Opening',
        selector: 'front-door-opening',
        category: 'opening-sensor',
        type: 'binary',
        read_only: true
      }
    ],
    service: { name: 'mqtt' }
  },
  {
    name: 'Garage door',
    selector: 'garage-door',
    room_id: LIVING_ROOM.id,
    room: LIVING_ROOM,
    features: [
      {
        name: 'Opening',
        selector: 'garage-door-opening',
        category: 'opening-sensor',
        type: 'binary',
        read_only: true
      }
    ],
    service: { name: 'mqtt' }
  }
];
const SUFFIX = Date.now();
const ONE_TRIGGER_SCENE = `trigger-variables-one-${SUFFIX}`;
const TWO_TRIGGERS_SCENE = `trigger-variables-two-${SUFFIX}`;
const PHONE_SCENE = `trigger-variables-phone-${SUFFIX}`;
const DOORS_TRIGGER = {
  type: 'device.new-state',
  device_features: ['front-door-opening', 'garage-door-opening'],
  operator: '=',
  value: 0
};
const VARIABLES = ['deviceName', 'deviceFeatureName', 'lastValue', 'previousValue'];

const apiRequest = (method, path, body) =>
  cy.window().then(win => {
    const { access_token: accessToken } = JSON.parse(win.localStorage.getItem('user'));
    return cy
      .request({
        method,
        url: `${Cypress.env('serverUrl')}/api/v1${path}`,
        headers: { authorization: `Bearer ${accessToken}` },
        body
      })
      .its('body');
  });

const createScene = (selector, triggers) =>
  apiRequest('POST', '/scene', {
    name: selector,
    selector,
    icon: 'activity',
    triggers,
    actions: [[{ type: 'message.send', user: 'tony', text: 'Opened:' }]]
  });

const openScene = selector => {
  cy.intercept('GET', '**/api/v1/device*', DEVICES).as('loadDevices');
  cy.visit(`/dashboard/scene/${selector}`);
  cy.wait('@loadDevices');
};

// The label of a variable of the trigger, as the trigger declares it
const variableLabel = key => Cypress.env('i18n').editScene.variables.device.newState[key];

// Typing '{{' in a text field opens the list of the variables available at this step
const openVariablesList = field => {
  cy.get(field).type(' {{}{{}');
  cy.get('.tagify__dropdown').should('be.visible');
};

describe('Scene - variables of a device state trigger', () => {
  beforeEach(() => {
    cy.login();
  });

  it('Should create the scenes', () => {
    cy.visit('/dashboard/scene');
    createScene(ONE_TRIGGER_SCENE, [DOORS_TRIGGER]);
    createScene(TWO_TRIGGERS_SCENE, [
      DOORS_TRIGGER,
      { type: 'device.new-state', device_features: ['front-door-opening'], operator: '=', value: 1 }
    ]);
    createScene(PHONE_SCENE, [DOORS_TRIGGER]);
  });

  it('Should list the variables of the trigger in a text field, and save the one picked', () => {
    cy.viewport(1280, 2400);
    openScene(ONE_TRIGGER_SCENE);
    cy.get('[data-cy="drag-step-0.0"]')
      .siblings('button[aria-expanded="false"]')
      .click();

    openVariablesList('.tagify__input');
    // every variable says it comes from the trigger, under the number of its card
    cy.get('.tagify__dropdown .tagify__dropdown__item').then(items => {
      expect([...items].map(item => item.textContent.trim())).to.deep.equal(
        VARIABLES.map(key => `1. ${variableLabel(key)}`)
      );
    });
    cy.contains('.tagify__dropdown__item', variableLabel('deviceName')).click();
    cy.get('.tagify__input .tagify__tag').should('contain', variableLabel('deviceName'));

    cy.contains('button', 'editScene.saveButton').click();
    cy.contains('editScene.savedLabel').should('exist');
    apiRequest('GET', `/scene/${ONE_TRIGGER_SCENE}`).then(scene => {
      expect(scene.actions[0][0].text).to.equal('Opened: {{triggerEvent.device.name}}');
    });

    // the collapsed step names the variable too, never its path
    cy.reload();
    cy.wait('@loadDevices');
    cy.get('[data-cy="drag-step-0.0"]')
      .parents('.card')
      .first()
      .should('contain', `Opened: [${variableLabel('deviceName')}]`)
      .and('not.contain', 'triggerEvent');
  });

  it('Should list the variables once when several device state triggers declare them', () => {
    cy.viewport(1280, 2400);
    openScene(TWO_TRIGGERS_SCENE);
    cy.get('[data-cy="drag-step-0.0"]')
      .siblings('button[aria-expanded="false"]')
      .click();

    // whichever trigger fires, the variables describe that one: they are not listed per trigger
    openVariablesList('.tagify__input');
    cy.get('.tagify__dropdown .tagify__dropdown__item').should('have.length', VARIABLES.length);
  });

  it('Should list the variables of the trigger in the sheet of a step, on a phone', () => {
    cy.viewport('iphone-x');
    openScene(PHONE_SCENE);
    // the form of the trigger is mounted in its closed sheet: it has declared its variables
    // before the sheet of the step is opened
    cy.get('[data-cy="scene-step-row-0.0"]').click();
    cy.get('[data-cy="scene-step-sheet-0.0"]').should('be.visible');
    openVariablesList('[data-cy="scene-step-sheet-0.0"] .tagify__input');
    cy.contains('.tagify__dropdown__item', variableLabel('previousValue')).click();
    cy.get('[data-cy="scene-step-sheet-0.0"] .tagify__input .tagify__tag').should(
      'contain',
      variableLabel('previousValue')
    );
  });

  it('Should delete the scenes', () => {
    cy.visit('/dashboard/scene');
    apiRequest('DELETE', `/scene/${ONE_TRIGGER_SCENE}`);
    apiRequest('DELETE', `/scene/${TWO_TRIGGERS_SCENE}`);
    apiRequest('DELETE', `/scene/${PHONE_SCENE}`);
  });
});
