// A text read out loud by a device from the "devices" widget: a feature
// music/play_notification is a Speak button, which opens a sheet with the text to
// say. The server turns it into speech (server/lib/scene/scene.actions.js).
describe('Dashboard Devices Box: a text to read out loud', () => {
  const serverUrl = Cypress.env('serverUrl');
  const { device: i18n } = Cypress.env('i18n');
  const speaker = 'speak-speaker';
  const toast = '[data-cy="device-command-error"]';
  const speakButton = () => cy.get('[data-cy="speak-button"]');
  const sheet = () => cy.get('[data-cy="speak-sheet"]');
  const field = () => cy.get('[data-cy="speak-text"]');
  const sendButton = () => cy.get('[data-cy="speak-send"]');
  // whatever the pointer of the machine running the tests
  const openSheet = () => {
    speakButton().click();
    field().click();
    field().should('have.focus');
  };
  const setMouse = hasMouse =>
    cy.window().then(win => {
      const matchMedia = win.matchMedia.bind(win);
      cy.stub(win, 'matchMedia').callsFake(query =>
        query === '(pointer: fine)' ? { matches: hasMouse } : matchMedia(query)
      );
    });

  // What the server sends to every screen of the user when the text could not be said
  const failure = overrides => ({
    type: 'device.set-value-error',
    payload: {
      client_id: null,
      cause: 'unreachable',
      device_feature_selector: speaker,
      device_feature_name: 'Play notification',
      device_selector: speaker,
      device_name: 'Rabbit',
      value: 'Hello',
      last_value: null,
      last_value_string: null,
      last_value_changed: null,
      ...overrides
    }
  });

  beforeEach(() => {
    cy.login();
    const { rooms } = Cypress.env('house');
    cy.request({ method: 'GET', url: `${serverUrl}/api/v1/room/${rooms[0].selector}` }).then(res => {
      cy.createDevice(
        {
          name: 'Rabbit',
          external_id: speaker,
          selector: speaker,
          room_id: res.body.id,
          features: [
            {
              name: 'Play notification',
              category: 'music',
              type: 'play_notification',
              external_id: speaker,
              selector: speaker,
              read_only: false,
              keep_history: false,
              has_feedback: false,
              min: 1,
              max: 1
            }
          ]
        },
        'example'
      );
    });
    cy.request({
      method: 'POST',
      url: `${serverUrl}/api/v1/dashboard`,
      body: {
        name: 'Test',
        type: 'test',
        selector: 'test',
        visibility: 'private',
        boxes: [[{ type: 'devices', name: 'Speakers', device_features: [speaker] }]]
      }
    });
    cy.intercept('POST', '**/api/v1/device_feature/*/value', { statusCode: 200, body: {} }).as('command');
    cy.visit('/dashboard/test');
    cy.waitForWebSocket();
  });

  afterEach(() => {
    cy.deleteDevices('example');
    cy.request({ method: 'DELETE', url: `${serverUrl}/api/v1/dashboard/test` });
  });

  it('Should send the text with the button, then close the sheet', () => {
    sheet().should('not.exist');
    openSheet();
    sheet().should('contain', 'Rabbit');
    sendButton().should('be.disabled');
    field().type('   ');
    sendButton().should('be.disabled');
    field().type("Hi, it's dad!  ");
    sendButton().click();
    cy.wait('@command').then(({ request }) => {
      expect(request.url).to.contain(`/device_feature/${speaker}/value`);
      expect(request.body.value).to.equal("Hi, it's dad!");
      expect(request.body.client_id).to.be.a('string');
    });
    sheet().should('not.exist');
    cy.get(toast).should('not.exist');
    // the next text starts from an empty field
    openSheet();
    field().should('have.value', '');
  });

  it('Should send the text with the Enter key, a number included', () => {
    openSheet();
    field().type('42{enter}');
    cy.wait('@command').then(({ request }) => {
      // a text, never a number: the server would hand a number to the device as it is
      expect(request.body.value).to.equal('42');
    });
    sheet().should('not.exist');
  });

  it('Should send nothing when the sheet is closed, and keep the text', () => {
    openSheet();
    field().type('Not now');
    cy.get('[data-cy="sheet-close"]').click();
    sheet().should('not.exist');
    openSheet();
    field().should('have.value', 'Not now');
    // the system "back" closes the sheet, the dashboard stays
    cy.go('back');
    sheet().should('not.exist');
    speakButton().should('be.visible');
    cy.location('pathname').should('eq', '/dashboard/test');
    cy.get('@command.all').should('have.length', 0);
  });

  it('Should be ready to type into with a mouse', () => {
    setMouse(true);
    speakButton().click();
    field().should('have.focus');
  });

  it('Should not bring up the keyboard of a touch screen before the field is touched', () => {
    setMouse(false);
    speakButton().click();
    sheet().should('have.focus');
    // the time the field would take the focus in
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(200);
    sheet().should('have.focus');
    field().click();
    field().should('have.focus');
  });

  it('Should keep the text and its button above the keyboard of a phone', () => {
    const screenHeight = 667;
    const keyboardHeight = 300;
    // the keyboard covers the bottom of the page, which keeps its size: only the visual viewport
    // says so
    const setKeyboard = (keyboard, offsetTop = 0) =>
      cy.window().then(win => {
        Object.assign(win.visualViewport, { height: screenHeight - keyboard, offsetTop });
        win.visualViewport.dispatchEvent(new win.Event('resize'));
      });
    const bottomOf = $element => $element[0].getBoundingClientRect().bottom;
    cy.viewport(375, screenHeight);
    cy.window().then(win => {
      const value = Object.assign(new win.EventTarget(), { height: screenHeight, offsetTop: 0, scale: 1 });
      Object.defineProperty(win, 'visualViewport', { value, configurable: true });
    });
    openSheet();
    sendButton().should($send => expect(bottomOf($send)).to.be.above(screenHeight - keyboardHeight));

    setKeyboard(keyboardHeight);
    sendButton().should($send => expect(bottomOf($send)).to.be.below(screenHeight - keyboardHeight));
    field().should($field => expect($field[0].getBoundingClientRect().top).to.be.above(0));

    // iOS also pans the page under the keyboard: the sheet only goes up by what is still hidden
    setKeyboard(keyboardHeight, 100);
    sendButton().should($send => {
      expect(bottomOf($send)).to.be.below(screenHeight - keyboardHeight + 100);
      expect(bottomOf($send)).to.be.above(screenHeight - keyboardHeight);
    });

    setKeyboard(0);
    sendButton().should($send => expect(bottomOf($send)).to.be.above(screenHeight - 100));
  });

  it('Should say that the voice is not available, and give the text back', () => {
    openSheet();
    field().type('Hello{enter}');
    cy.wait('@command').then(({ request }) => {
      cy.sendWebSocket(failure({ client_id: request.body.client_id, cause: 'voice-unavailable' }));
    });
    cy.get(toast).should('contain', i18n.setValueError.voiceUnavailable.replace('{{name}}', 'Rabbit'));
    sheet().should('not.exist');
    openSheet();
    field().should('have.value', 'Hello');
    sendButton().should('not.be.disabled');
  });

  it('Should not overwrite a text typed before the failure is known', () => {
    openSheet();
    field().type('Hello{enter}');
    cy.wait('@command').then(({ request }) => {
      sheet().should('not.exist');
      openSheet();
      field().type('Another text');
      cy.sendWebSocket(failure({ client_id: request.body.client_id }));
    });
    cy.get(toast).should('contain', i18n.setValueError.unreachable.replace('{{name}}', 'Rabbit'));
    field().should('have.value', 'Another text');
  });
});
