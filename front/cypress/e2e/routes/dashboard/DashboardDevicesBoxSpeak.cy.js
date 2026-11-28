// An announcement from the "devices" widget: a feature music/play_notification is an
// "Announce…" button, which opens a sheet with the text to say. The server turns it into
// speech (server/lib/scene/scene.actions.js).
describe('Dashboard Devices Box: a text to read out loud', () => {
  const serverUrl = Cypress.env('serverUrl');
  const { device: i18n } = Cypress.env('i18n');
  const speaker = 'speak-speaker';
  const toast = '[data-cy="device-command-error"]';
  const sentToast = '[data-cy="speak-sent"]';
  const sentSentence = i18n => i18n.speakSent.replace('{{name}}', 'Rabbit');
  const { dashboard } = Cypress.env('i18n');
  const widgetI18n = dashboard.boxes.devicesInRoom;
  const speakButton = () => cy.get('[data-cy="speak-button"]');
  const sheet = () => cy.get('[data-cy="speak-sheet"]');
  const field = () => cy.get('[data-cy="speak-text"]');
  const sendButton = () => cy.get('[data-cy="speak-send"]');
  const openSheet = () => {
    speakButton().click();
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
      speak: true,
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
        // the row name the editor stores: the sheet and the toasts name the device
        boxes: [
          [
            {
              type: 'devices',
              name: 'Speakers',
              device_features: [speaker],
              device_feature_names: ['Rabbit (Play notification)']
            }
          ]
        ]
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

  it('Should send the text with the button, then close the sheet and say it is sent', () => {
    sheet().should('not.exist');
    speakButton().should('have.text', widgetI18n.speakButton);
    cy.contains('tr', 'Rabbit (Play notification)')
      .find('i.fe')
      .should('have.class', 'fe-volume-2');
    openSheet();
    sheet()
      .find('h2')
      .should('have.text', widgetI18n.speakSheetTitle.replace('{{name}}', 'Rabbit'));
    field().should('have.attr', 'maxlength', '2000');
    sendButton().should('be.disabled');
    field().type('   ');
    sendButton().should('be.disabled');
    field().type("Hi, it's dad!  ");
    sendButton().click();
    cy.wait('@command').then(({ request }) => {
      expect(request.url).to.contain(`/device_feature/${speaker}/value`);
      expect(request.body.value).to.equal("Hi, it's dad!");
      // the server reads it out loud only when it is asked to
      expect(request.body.speak).to.equal(true);
      expect(request.body.client_id).to.be.a('string');
    });
    sheet().should('not.exist');
    cy.get(sentToast).should('contain', sentSentence(widgetI18n));
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

  it('Should be ready to type into with a mouse, and give the focus back to its button', () => {
    setMouse(true);
    speakButton().click();
    field().should('have.focus');
    cy.get('[data-cy="sheet-close"]').click();
    sheet().should('not.exist');
    speakButton().should('have.focus');
  });

  it('Should give the focus back to its button with a mouse that does not focus it on click (Safari)', () => {
    setMouse(true);
    // a click that does not move the focus, as Safari does on a button: the sheet then remembers
    // <body> as the element that had the focus when it opened
    speakButton().then(([button]) => button.click());
    field().should('have.focus');
    cy.get('[data-cy="sheet-close"]').click();
    sheet().should('not.exist');
    speakButton().should('have.focus');
  });

  it('Should be ready to type into on a touch screen too, its keyboard held by a stand-in field', () => {
    setMouse(false);
    speakButton().click();
    field().should('have.focus');
    // the stand-in only lives for the tap
    cy.get('[data-cy="speak-keyboard-stand-in"]').should('not.exist');
    cy.get('[data-cy="sheet-close"]').click();
    sheet().should('not.exist');
    cy.get('[data-cy="speak-keyboard-stand-in"]').should('not.exist');
    // the focus goes back to the button, not to the stand-in which held it at the tap
    speakButton().should('have.focus');
    // after a send too
    speakButton().click();
    field().type('Hello{enter}');
    cy.wait('@command');
    sheet().should('not.exist');
    speakButton().should('have.focus');
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
    cy.get(toast).should('contain', i18n.setValueError.textKept);
    cy.get(sentToast).should('not.exist');
    sheet().should('not.exist');
    openSheet();
    field().should('have.value', 'Hello');
    sendButton().should('not.be.disabled');
  });

  it('Should say what to do when the voice of Gladys Plus needs a subscription or reached its quota', () => {
    [
      ['voice-subscription-required', i18n.setValueError.voiceSubscriptionRequired],
      ['voice-quota-reached', i18n.setValueError.voiceQuotaReached]
    ].forEach(([cause, sentence]) => {
      openSheet();
      field().type('Hello{enter}');
      cy.wait('@command').then(({ request }) => {
        cy.sendWebSocket(failure({ client_id: request.body.client_id, cause }));
      });
      cy.get(toast).should('contain', sentence.replace('{{name}}', 'Rabbit'));
      cy.get('[data-cy="mobile-toast-close"]').click({ multiple: true, force: true });
    });
  });

  it('Should give the text back when its request fails after a first text was sent', () => {
    openSheet();
    field().type('First text{enter}');
    cy.wait('@command');
    cy.get(sentToast).should('contain', sentSentence(widgetI18n));
    // the next request does not go through
    cy.intercept('POST', '**/api/v1/device_feature/*/value', { statusCode: 500, body: {} }).as('failedCommand');
    openSheet();
    field().type('Second text{enter}');
    cy.wait('@failedCommand');
    cy.get(toast).should('contain', i18n.setValueError.textKept);
    cy.get(sentToast).should('not.exist');
    openSheet();
    field().should('have.value', 'Second text');
  });

  it('Should give back only the text which failed, and none from elsewhere', () => {
    openSheet();
    field().type('First text{enter}');
    cy.wait('@command');
    openSheet();
    field().type('Second text{enter}');
    cy.wait('@command').then(({ request }) => {
      // a text this widget never sent, then a failure of another screen
      cy.sendWebSocket(failure({ client_id: request.body.client_id, value: 'Older text' }));
      cy.sendWebSocket(failure({ client_id: 'another-screen', value: 'Second text' }));
    });
    openSheet();
    field().should('have.value', '');
    cy.get('[data-cy="sheet-close"]').click();
    // the first text failed after the second one left
    cy.get('@command').then(({ request }) => {
      cy.sendWebSocket(failure({ client_id: request.body.client_id, value: 'First text' }));
    });
    cy.get(toast).should('contain', i18n.setValueError.textKept);
    openSheet();
    field().should('have.value', 'First text');
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
