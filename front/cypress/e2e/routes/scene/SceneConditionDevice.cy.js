// A condition of an "only continue if" step compares a variable of the scene or the current
// state of a device, picked in one select: the devices are listed by room after the variables,
// the pick is stored as `device_feature` (or `variable`, never both), and a scene saved with a
// variable keeps working. The devices are stubbed, the scenes are created and saved through
// the real server.
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
    name: 'Thermometer',
    selector: 'thermometer',
    room_id: null,
    room: null,
    features: [
      {
        name: 'Température',
        selector: 'thermometer-temperature',
        category: 'temperature-sensor',
        type: 'decimal',
        unit: 'celsius',
        read_only: true
      }
    ],
    service: { name: 'mqtt' }
  }
];
const SUFFIX = Date.now();
const NEW_SCENE = `condition-device-new-${SUFFIX}`;
const VARIABLE_SCENE = `condition-device-variable-${SUFFIX}`;
const DELETED_SCENE = `condition-device-deleted-${SUFFIX}`;
const PHONE_NEW_SCENE = `condition-device-phone-new-${SUFFIX}`;
const PHONE_VARIABLE_SCENE = `condition-device-phone-variable-${SUFFIX}`;
const VARIABLE_STEPS = [
  [{ type: 'device.get-value', device_feature: 'thermometer-temperature' }],
  [{ type: 'condition.only-continue-if', conditions: [{ variable: '0.0.last_value', operator: '>', value: 20 }] }]
];
const SELECT = '[data-cy="scene-condition-device-or-variable"]';

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

const createScene = (selector, actions) =>
  apiRequest('POST', '/scene', { name: selector, selector, icon: 'activity', triggers: [], actions });

const openScene = selector => {
  cy.intercept('GET', '**/api/v1/device*', DEVICES).as('loadDevices');
  cy.visit(`/dashboard/scene/${selector}`);
  cy.wait('@loadDevices');
};

const expandStep = path =>
  cy
    .get(`[data-cy="drag-step-${path}"]`)
    .siblings('button[aria-expanded="false"]')
    .click();

// The menu of a select is rendered through a portal on <body> and closes on any scroll of the
// page, the one Cypress does to bring a control into view included: its scroll event reaches
// the page after the click and closes the menu that click opened. The viewport of this spec is
// tall enough to show the whole editor, so nothing has to scroll.
const openMenu = control => {
  cy.get(control).click({ scrollBehavior: false });
  cy.get('.react-select__menu').should('be.visible');
};

const pickOption = label =>
  cy
    .get('.react-select__menu')
    .contains('.react-select__option', label)
    .click({ scrollBehavior: false });

// The labels of the two states of an opening sensor, as the value list shows them
const openingLabel = value => Cypress.env('i18n').deviceFeatureValue.category['opening-sensor'].binary[value];

// The value of a feature holding constants is picked in a list (the third field of the row)
const pickValue = label => {
  cy.get('.card-body:visible .react-select__control')
    .eq(1)
    .as('valueControl');
  openMenu('@valueControl');
  pickOption(label);
};

const saveScene = () => {
  cy.contains('button', 'editScene.saveButton').click();
  cy.contains('editScene.savedLabel').should('exist');
};

describe('Scene - condition on the current state of a device', () => {
  beforeEach(() => {
    cy.viewport(1280, 1600);
    cy.login();
  });

  it('Should create the scenes', () => {
    cy.visit('/dashboard/scene');
    createScene(NEW_SCENE, []);
    createScene(VARIABLE_SCENE, VARIABLE_STEPS);
    createScene(DELETED_SCENE, [
      [
        {
          type: 'condition.only-continue-if',
          conditions: [{ device_feature: 'deleted-device-feature', operator: '=', value: 1 }]
        }
      ]
    ]);
  });

  it('Should list the devices by room, without any step before, and save the picked device', () => {
    openScene(NEW_SCENE);
    // the condition is the first step of the scene: no "get the last state" step before it
    cy.contains('editScene.addStepButton').click();
    cy.get('[data-cy="type-picker-option"][data-value="condition.only-continue-if"]').click();
    openMenu(`${SELECT} .react-select__control`);
    // one group per room, the devices without a room last
    cy.get('.react-select__menu .react-select__group-heading').then(headings => {
      expect([...headings].map(heading => heading.textContent)).to.deep.equal([
        'Living Room',
        Cypress.env('i18n').device.noRoom
      ]);
    });
    // the search ignores accents and matches the room too
    cy.get(`${SELECT} .react-select__input input`).type('temperature', { scrollBehavior: false });
    cy.get('.react-select__menu .react-select__option').should('have.length', 1);
    cy.get(`${SELECT} .react-select__input input`).clear({ scrollBehavior: false });
    cy.get(`${SELECT} .react-select__input input`).type('living door', { scrollBehavior: false });
    cy.get('.react-select__menu .react-select__option').should('have.length', 1);
    pickOption('Front door (Opening)');
    cy.get(`${SELECT} .react-select__single-value`).should('have.text', 'Front door (Opening)');

    cy.get('.card-body:visible select.form-control')
      .first()
      .select('=');
    // a feature holding constants offers their list as the value
    pickValue(openingLabel('zero'));

    saveScene();
    apiRequest('GET', `/scene/${NEW_SCENE}`).then(scene => {
      expect(scene.actions[0][0].conditions).to.deep.equal([
        { device_feature: 'front-door-opening', operator: '=', value: 0 }
      ]);
    });
  });

  it('Should name the device and its value in the collapsed step, and keep the pick when reopened', () => {
    openScene(NEW_SCENE);
    cy.get('[class*="stepSummary"]').should('have.text', `Front door (Opening) = ${openingLabel('zero')}`);
    expandStep('0.0');
    cy.get(`${SELECT} .react-select__single-value`).should('have.text', 'Front door (Opening)');
  });

  it('Should keep a condition on a variable, and replace it by a device without keeping both', () => {
    openScene(VARIABLE_SCENE);
    expandStep('1.0');
    cy.get(`${SELECT} .react-select__single-value`).should('have.text', 'Thermometer (Température)');
    openMenu(`${SELECT} .react-select__control`);
    // the variable of the previous step first, then the devices
    cy.get('.react-select__menu .react-select__group-heading').should('have.length', 3);
    pickOption('Front door (Opening)');
    // the value typed for the temperature is not a state of a door: it is dropped
    pickValue(openingLabel('one'));

    saveScene();
    apiRequest('GET', `/scene/${VARIABLE_SCENE}`).then(scene => {
      expect(scene.actions[1][0].conditions).to.deep.equal([
        { device_feature: 'front-door-opening', operator: '>', value: 1 }
      ]);
    });
  });

  it('Should show a feature whose device is gone as it is stored, and keep it in the saved scene', () => {
    openScene(DELETED_SCENE);
    cy.get('[class*="stepSummary"]').should('have.text', 'deleted-device-feature = 1');
    expandStep('0.0');
    cy.get(`${SELECT} .react-select__single-value`).should('have.text', 'deleted-device-feature');
    cy.get('.card-body:visible select.form-control')
      .first()
      .select('!=');

    saveScene();
    apiRequest('GET', `/scene/${DELETED_SCENE}`).then(scene => {
      expect(scene.actions[0][0].conditions).to.deep.equal([
        { device_feature: 'deleted-device-feature', operator: '!=', value: 1 }
      ]);
    });
  });

  it('Should delete the scenes', () => {
    cy.visit('/dashboard/scene');
    apiRequest('DELETE', `/scene/${NEW_SCENE}`);
    apiRequest('DELETE', `/scene/${VARIABLE_SCENE}`);
    apiRequest('DELETE', `/scene/${DELETED_SCENE}`);
  });
});

// On a phone the device is picked by room in the device picker sheet, like every device field
// of the scene forms, and never in a menu of every device of the house
// (docs/specs/scene-editor-mobile.md, C.6 and E.10)
describe('Scene - condition on the current state of a device, on a phone', () => {
  const FIELD = `[data-cy="scene-condition-device-or-variable"]`;

  beforeEach(() => {
    cy.viewport('iphone-x');
    cy.login();
  });

  it('Should create the scenes', () => {
    cy.visit('/dashboard/scene');
    createScene(PHONE_NEW_SCENE, []);
    createScene(PHONE_VARIABLE_SCENE, VARIABLE_STEPS);
  });

  it('Should offer one "choose a device" button for a first condition, and pick the device in the sheet', () => {
    openScene(PHONE_NEW_SCENE);
    cy.get('[data-cy=scene-add-step]').click();
    cy.get(
      '[data-cy="scene-step-sheet-0.0"] [data-cy="type-picker-option"][data-value="condition.only-continue-if"]'
    ).click();

    // no variable to offer at the first step: no switch, and no select listing every device
    cy.get(`${FIELD} [data-cy="scene-condition-source"]`).should('not.exist');
    cy.get(`${FIELD} .react-select__control`).should('not.exist');
    cy.get(`${FIELD} [data-cy="device-picker-open"]`)
      .should('be.visible')
      .click();
    cy.get('[data-cy="device-picker-sheet"]').should('be.visible');
    // one tap picks the device and closes the picker
    cy.get('[data-cy="picker-feature-front-door-opening"]').click();
    cy.get('[data-cy="device-picker-sheet"]').should('not.exist');
    cy.get(`${FIELD} [data-cy="device-picker-item-front-door-opening"]`).should('contain', 'Front door');

    cy.get('[data-cy="scene-step-sheet-0.0"] select.form-control').select('=');
    cy.get('body').type('{esc}');
    cy.get('[data-cy="scene-step-row-0.0"]').should('contain', 'Front door (Opening)');

    cy.intercept('PATCH', '**/api/v1/scene/*').as('saveScene');
    cy.get('[data-cy=scene-save-button]').click();
    cy.wait('@saveScene').then(({ request }) => {
      expect(request.body.actions[0][0].conditions).to.deep.equal([
        { device_feature: 'front-door-opening', operator: '=' }
      ]);
    });
  });

  it('Should switch between the variable and a device without losing either', () => {
    openScene(PHONE_VARIABLE_SCENE);
    cy.get('[data-cy="scene-step-row-1.0"]').click();
    // the condition holds a variable: its side is shown, in a select of the variables alone
    cy.get(`${FIELD} [data-cy="scene-condition-source-variable"]`).should('have.attr', 'aria-pressed', 'true');
    cy.get(`${FIELD} .react-select__single-value`).should('have.text', 'Thermometer (Température)');
    cy.get(`${FIELD} [data-cy="device-picker-open"]`).should('not.exist');

    // the device side starts empty, the variable is put aside
    cy.get(`${FIELD} [data-cy="scene-condition-source-device"]`).click();
    cy.get(`${FIELD} [data-cy^="device-picker-item-"]`).should('not.exist');
    cy.get(`${FIELD} .react-select__control`).should('not.exist');
    cy.get(`${FIELD} [data-cy="scene-condition-source-variable"]`).click();
    cy.get(`${FIELD} .react-select__single-value`).should('have.text', 'Thermometer (Température)');

    // a device is picked, then the same round trip brings each side back
    cy.get(`${FIELD} [data-cy="scene-condition-source-device"]`).click();
    cy.get(`${FIELD} [data-cy="device-picker-open"]`).click();
    cy.get('[data-cy="picker-feature-front-door-opening"]').click();
    cy.get(`${FIELD} [data-cy="device-picker-item-front-door-opening"]`).should('be.visible');
    cy.get(`${FIELD} [data-cy="scene-condition-source-variable"]`).click();
    cy.get(`${FIELD} .react-select__single-value`).should('have.text', 'Thermometer (Température)');
    cy.get(`${FIELD} [data-cy="scene-condition-source-device"]`).click();
    cy.get(`${FIELD} [data-cy="device-picker-item-front-door-opening"]`).should('be.visible');
    cy.get('body').type('{esc}');

    cy.intercept('PATCH', '**/api/v1/scene/*').as('saveScene');
    cy.get('[data-cy=scene-save-button]').click();
    cy.wait('@saveScene').then(({ request }) => {
      // one attribute, never both; the value typed for a temperature is not a state of a door
      expect(request.body.actions[1][0].conditions).to.deep.equal([
        { device_feature: 'front-door-opening', operator: '>' }
      ]);
    });
  });

  it('Should delete the scenes', () => {
    cy.visit('/dashboard/scene');
    apiRequest('DELETE', `/scene/${PHONE_NEW_SCENE}`);
    apiRequest('DELETE', `/scene/${PHONE_VARIABLE_SCENE}`);
  });
});
