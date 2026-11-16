// The onboarding on a phone (docs/specs/mobile-pages/onboarding.md).
//
// The API is stubbed: the real onboarding only exists on a fresh instance, where it is the
// desktop spec (0-signup/SignUp.cy.js) that creates the account every other spec logs in with.
// Stubbed, this spec runs on any instance and writes nothing — it checks what the phone layout
// sends, not what the server does with it.
describe('Onboarding on a phone', () => {
  const serverUrl = Cypress.env('serverUrl');
  const user = {
    id: '3a5d1a8a-6f4b-4a43-9a2c-3d0f5c0a7b11',
    firstname: 'Tony',
    lastname: 'Stark',
    selector: 'tony',
    email: 'tony.stark@gladysassistant.com',
    language: 'en',
    role: 'admin',
    access_token: 'fake-access-token',
    refresh_token: 'fake-refresh-token',
    session_id: 'fake-session'
  };

  // The position of the phone, answered by the test
  const stubGeolocation = win => {
    Object.defineProperty(win.navigator, 'geolocation', {
      value: {
        getCurrentPosition: onSuccess => onSuccess({ coords: { latitude: 45.764, longitude: 4.8357 } })
      },
      configurable: true
    });
  };

  beforeEach(() => {
    cy.viewport('iphone-x');
    // nothing reaches the instance: every route answers, the ones the flow reads answer in shape
    cy.intercept({ url: `${serverUrl}/api/v1/**` }, { body: {} });
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/setup` }, { body: { account_configured: false } });
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/me` }, { body: user });
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/gateway/status` }, { body: { configured: false } });
    cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/signup` }, { body: user }).as('signup');
  });

  it('should welcome with one primary action, the progress and the restore as a row', () => {
    cy.visit('/signup');
    cy.get('[data-cy=signup-mobile]').should('be.visible');
    cy.get('[data-cy=mobile-steps-label]')
      .should('contain', '1')
      .and('contain', '5')
      .i18n('login.welcome');
    cy.get('[data-cy=signup-create-account]')
      .should('be.visible')
      .i18n('signup.welcome.buttonCreateAccountWithEmail');
    cy.get('[data-cy=signup-restore-backup]').i18n('signup.welcome.buttonCreateAccountGladysGateway');
    // nothing scrolls sideways
    cy.document().then(doc => {
      expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth);
    });
  });

  it('should give each field its keyboard and show the errors next to the fields', () => {
    cy.visit('/signup');
    cy.get('[data-cy=signup-create-account]').click();
    cy.location('pathname').should('eq', '/signup/create-account-local');
    cy.get('[data-cy=signup-account-mobile]').should('be.visible');
    cy.get('[data-cy=mobile-steps-label]').i18n('login.createAccountStep');

    cy.get('[data-cy=signup-firstname]')
      .should('have.attr', 'autocomplete', 'given-name')
      .and('have.css', 'font-size', '16px');
    cy.get('[data-cy=signup-lastname]').should('have.attr', 'autocomplete', 'family-name');
    cy.get('[data-cy=signup-email]')
      .should('have.attr', 'autocomplete', 'email')
      .and('have.attr', 'type', 'email');
    cy.get('[data-cy=signup-password]')
      .should('have.attr', 'autocomplete', 'new-password')
      .and('have.attr', 'type', 'password');
    cy.get('[data-cy=signup-language]').should('have.css', 'font-size', '16px');

    // an empty form: four errors, the first refused field in view and focused
    cy.get('[data-cy=signup-create-account-submit]').click();
    cy.get('[data-cy=signup-account-mobile] [role=alert]').should('have.length', 4);
    cy.get('[data-cy=signup-account-mobile]')
      .i18n('profile.firstnameError')
      .i18n('profile.lastnameError')
      .i18n('profile.emailError')
      .i18n('profile.passwordError');
    cy.focused().should('have.attr', 'data-cy', 'signup-firstname');

    cy.get('[data-cy=signup-firstname]').type(user.firstname);
    cy.get('[data-cy=signup-lastname]').type(user.lastname);
    cy.get('[data-cy=signup-email]').type(user.email);
    cy.get('[data-cy=signup-password]').type('short');
    cy.get('[data-cy=signup-passwordRepeat]').type('short');
    cy.get('[data-cy=signup-account-mobile] [role=alert]')
      .should('have.length', 1)
      .i18n('profile.passwordError');

    // the password can be read while it is typed
    cy.get('[data-cy=signup-password-reveal]').click();
    cy.get('[data-cy=signup-password]')
      .should('have.attr', 'type', 'text')
      .and('have.value', 'short');

    cy.get('[data-cy=signup-password]').clear();
    cy.get('[data-cy=signup-password]').type('a-long-password');
    cy.get('[data-cy=signup-account-mobile] [role=alert]')
      .should('have.length', 1)
      .i18n('profile.passwordRepeatError');
    cy.get('@signup.all').should('have.length', 0);

    // the way back to the first step
    cy.get('[data-cy=mobile-nav-back]').click();
    cy.location('pathname').should('eq', '/signup');
  });

  it('should go from the account to the dashboard: account, preferences, house, success', () => {
    cy.intercept({ method: 'PATCH', url: `${serverUrl}/api/v1/me` }, { body: user }).as('savePreferences');
    cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/variable/*` }, { body: {} }).as('saveHistory');
    cy.intercept(
      { method: 'POST', url: `${serverUrl}/api/v1/house` },
      { body: { id: 'house-id', name: 'My phone house', selector: 'my-phone-house' } }
    ).as('createHouse');
    cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/house/my-phone-house/room` }, { body: {} }).as(
      'createRoom'
    );
    cy.intercept(
      { method: 'GET', url: 'https://nominatim.openstreetmap.org/search*' },
      { body: [{ place_id: 42, display_name: '10 Main Street, Springfield', lat: '39.7817', lon: '-89.6501' }] }
    ).as('searchAddress');

    cy.visit('/signup', { onBeforeLoad: stubGeolocation });
    cy.get('[data-cy=signup-create-account]').click();

    // 2. the account
    cy.get('[data-cy=signup-firstname]').type(user.firstname);
    cy.get('[data-cy=signup-lastname]').type(user.lastname);
    cy.get('[data-cy=signup-email]').type(user.email);
    cy.get('[data-cy=signup-language]').select('en');
    cy.get('[data-cy=signup-password]').type('a-long-password');
    cy.get('[data-cy=signup-passwordRepeat]').type('a-long-password');
    cy.get('[data-cy=signup-create-account-submit]').click();
    cy.wait('@signup')
      .its('request.body')
      .should('include', {
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        language: 'en',
        role: 'admin',
        password: 'a-long-password'
      });

    // 3. the preferences: two segmented choices and a list
    cy.location('pathname').should('eq', '/signup/preference');
    cy.get('[data-cy=signup-preferences-mobile]').should('be.visible');
    cy.get('[data-cy=mobile-steps-label]').i18n('login.preferencesStep');
    cy.get('[data-cy=signup-unit-celsius]').should('have.attr', 'aria-pressed', 'true');
    cy.get('[data-cy=signup-unit-fahrenheit]').click();
    cy.get('[data-cy=signup-unit-fahrenheit]').should('have.attr', 'aria-pressed', 'true');
    cy.get('[data-cy=signup-unit-us]').click();
    cy.get('[data-cy=signup-history-duration]').select('365');
    cy.get('[data-cy=signup-save-preferences]').click();
    cy.wait('@savePreferences')
      .its('request.body')
      .should('deep.equal', { temperature_unit_preference: 'fahrenheit', distance_unit_preference: 'us' });
    cy.wait('@saveHistory')
      .its('request.body')
      .should('deep.equal', { value: 365 });

    // 4. the house
    cy.location('pathname').should('eq', '/signup/configure-house');
    cy.get('[data-cy=signup-house-mobile]').should('be.visible');
    cy.get('[data-cy=signup-save-house]').click();
    cy.get('[data-cy=signup-house-mobile]').i18n('signup.configureHouse.houseNameError');
    cy.get('@createHouse.all').should('have.length', 0);
    cy.get('[data-cy=signup-house-name]').type('My phone house');

    cy.get('[data-cy=house-location-status]').i18n('housesSettings.mobile.positionNotSet');
    cy.get('[data-cy=address-search-input]').type('10 main street{enter}');
    cy.wait('@searchAddress');
    cy.contains('[data-cy=address-search-results] button', '10 Main Street, Springfield').click();
    cy.get('[data-cy=house-location-status]').i18n('housesSettings.mobile.positionSet');
    // the position of the phone replaces it
    cy.get('[data-cy=house-locate-me]').click();

    // the rooms: suggestions are toggles, a room can be added by its name
    cy.contains('[data-cy=room-suggestion]', 'Kitchen').click();
    cy.contains('[data-cy=room-suggestion]', 'Bedroom').click();
    cy.contains('[data-cy=room-suggestion]', 'Garage').click();
    cy.contains('[data-cy=room-suggestion]', 'Garage').click();
    cy.contains('[data-cy=room-suggestion]', 'Garage').should('have.attr', 'aria-pressed', 'false');
    cy.get('[data-cy=signup-new-room-name]').type('Workshop');
    cy.get('[data-cy=signup-new-room-add]').click();
    cy.contains('[data-cy=room-suggestion]', 'Workshop').should('have.attr', 'aria-pressed', 'true');
    cy.get('[data-cy=signup-new-room-name]').type('Kitchen');
    cy.get('[data-cy=signup-new-room-add]').click();
    cy.get('[data-cy=signup-house-mobile]').i18n('housesSettings.mobile.roomNameTaken');
    cy.get('[data-cy=signup-new-room-name]').clear();

    cy.get('[data-cy=signup-save-house]').click();
    cy.wait('@createHouse')
      .its('request.body')
      .should('deep.equal', { name: 'My phone house', latitude: 45.764, longitude: 4.8357 });
    cy.wait(['@createRoom', '@createRoom', '@createRoom']).then(interceptions => {
      expect(interceptions.map(interception => interception.request.body.name).sort()).to.deep.equal([
        'Bedroom',
        'Kitchen',
        'Workshop'
      ]);
    });

    // 5. the end
    cy.location('pathname').should('eq', '/signup/success');
    cy.get('[data-cy=signup-success-mobile]').should('be.visible');
    cy.get('[data-cy=mobile-steps-label]').i18n('login.success');
    cy.get('[data-cy=signup-go-to-dashboard]')
      .should('have.attr', 'href', '/dashboard')
      .i18n('signup.success.goToDashboardButton');
  });

  it('should restore a Gladys Plus backup: the key, the backups as rows, a confirmation', () => {
    cy.intercept({ method: 'GET', url: `${serverUrl}/api/v1/gateway/status` }, { body: { configured: true } });
    cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/gateway/backup-key` }, { body: { success: true } }).as(
      'saveBackupKey'
    );
    cy.intercept(
      { method: 'GET', url: `${serverUrl}/api/v1/gateway/backup` },
      {
        body: [
          { id: 'backup-1', path: 'https://backups/1', size: 45234123, created_at: '2026-11-15T08:00:00.000Z' },
          { id: 'backup-2', path: 'https://backups/2', size: 44000000, created_at: '2026-11-14T08:00:00.000Z' }
        ]
      }
    );
    cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/gateway/backup/restore` }).as('restore');

    cy.visit('/signup');
    cy.get('[data-cy=signup-restore-backup]').click();
    cy.location('pathname').should('eq', '/signup/create-account-gladys-gateway');
    cy.get('[data-cy=signup-restore-key-mobile]').should('be.visible');
    cy.get('[data-cy=signup-restore-key]')
      .should('have.attr', 'autocapitalize', 'off')
      .and('have.css', 'font-size', '16px');
    cy.get('[data-cy=signup-restore-key]').type('my-backup-key');
    cy.get('[data-cy=signup-restore-key-save]').click();
    cy.wait('@saveBackupKey')
      .its('request.body')
      .should('deep.equal', { backup_key: 'my-backup-key' });

    cy.get('[data-cy=signup-restore-backups-mobile]').should('be.visible');
    cy.get('[data-cy=signup-restore-backup-row]').should('have.length', 2);
    // nothing is restored on a single tap
    cy.get('[data-cy=signup-restore-backup-row]')
      .first()
      .click();
    cy.get('[data-cy=signup-restore-confirm]')
      .should('be.visible')
      .i18n('signup.mobile.restoreConfirmText');
    cy.get('[data-cy=signup-restore-confirm] [data-cy=confirm-sheet-cancel]').click();
    cy.get('[data-cy=signup-restore-confirm]').should('not.exist');
    cy.get('@restore.all').should('have.length', 0);

    cy.get('[data-cy=signup-restore-change-key]').click();
    cy.get('[data-cy=signup-restore-key-mobile]').should('be.visible');
    // the way out of the restore: a local account
    cy.get('[data-cy=signup-restore-local-account]').click();
    cy.location('pathname').should('eq', '/signup/create-account-local');
  });

  it('should keep the card and the step pills on a wider screen', () => {
    cy.viewport(1280, 800);
    cy.visit('/signup');
    cy.contains('signup.welcome.buttonCreateAccountWithEmail').should('be.visible');
    cy.get('[data-cy=signup-mobile]').should('not.exist');
    cy.get('[data-cy=mobile-steps-label]').should('not.exist');
  });
});
