describe('Sign-up', () => {
  it('Sign-Up - Check   page', () => {
    // Go to home page
    cy.visit('/');

    // Check redirected to sign-up page
    cy.location('pathname').should('eq', '/signup');

    // Check two buttons available
    cy.contains('signup.welcome.buttonCreateAccountGladysGateway').should('not.be.disabled');
    cy.contains('signup.welcome.buttonCreateAccountWithEmail').should('not.be.disabled');
  });

  it('Create new account - check page', () => {
    // Click on create account button
    cy.contains('signup.welcome.buttonCreateAccountWithEmail').click();

    // Check redirected to create account page
    cy.location('pathname').should('eq', '/signup/create-account-local');

    // Count fields
    cy.get('input:visible').should('be.length', 6);
    cy.get('select').should('be.length', 1);
    cy.get('button').should('be.length', 1);
  });

  it('Create new account - empty form', () => {
    // Submit empty form
    cy.contains('button', 'signup.createLocalAccount.createAccountButton').click();

    // Check errors
    cy.get('.invalid-feedback:visible')
      .should('be.length', 4)
      .then(elements => {
        cy.wrap(elements[0]).i18n('profile.firstnameError');
        cy.wrap(elements[1]).i18n('profile.lastnameError');
        cy.wrap(elements[2]).i18n('profile.emailError');
        cy.wrap(elements[3]).i18n('profile.passwordError');
      });
  });

  it('Create new account - too short password', () => {
    const { tony } = Cypress.env('users');
    const language = Cypress.env('language');

    // Fill form
    cy.get('input:visible').then(inputs => {
      // First name
      cy.wrap(inputs[0]).type(tony.firstname);
      // Last name
      cy.wrap(inputs[1]).type(tony.lastname);
      // Email
      cy.wrap(inputs[3]).type(tony.email);
      // Password
      cy.wrap(inputs[4]).type('short');
      // Password retype
      cy.wrap(inputs[5]).type('short');
    });

    cy.get('select:visible').then(selects => {
      // Language
      cy.wrap(selects[0]).select(language);
    });

    // Submit empty form
    cy.contains('button', 'signup.createLocalAccount.createAccountButton').click();

    // Check errors
    cy.get('.invalid-feedback:visible')
      .should('be.length', 1)
      .i18n('profile.passwordError');
  });

  it('Create new account - not same password', () => {
    const { tony } = Cypress.env('users');

    // Fill form
    cy.get('input:visible').then(inputs => {
      // Password
      cy.wrap(inputs[4])
        .clear()
        .type(tony.password);
    });

    // Submit empty form
    cy.contains('button', 'signup.createLocalAccount.createAccountButton').click();

    // Check errors
    cy.get('.invalid-feedback:visible')
      .should('be.length', 1)
      .i18n('profile.passwordRepeatError');
  });

  it('Create new account - done', () => {
    const users = Cypress.env('users');
    const { tony } = users;

    // Fill form
    cy.get('input:visible').then(inputs => {
      // Password
      cy.wrap(inputs[5])
        .clear()
        .type(tony.password);
    });

    // Store access token
    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      {
        method: 'POST',
        url: `${serverUrl}/api/v1/signup`
      },
      req => {
        req.reply(res => {
          window.localStorage.setItem('user', JSON.stringify(res.body));
        });
      }
    );

    // Submit empty form
    cy.contains('button', 'signup.createLocalAccount.createAccountButton').click();

    // Check redirected to preference page
    cy.location('pathname').should('eq', '/signup/preference');
  });

  it('Setup preferences - done', () => {
    // Submit form
    cy.contains('button', 'signup.preferences.saveSettingsButton').click();

    // Check redirected to house page
    cy.location('pathname').should('eq', '/signup/configure-house');
  });

  it('Setup house - done', () => {
    const house = Cypress.env('house');

    // Fill form
    cy.get('input:visible').then(inputs => {
      // House name
      cy.wrap(inputs[0])
        .clear()
        .type(house.name);

      // Room
      house.rooms.forEach(room => {
        cy.wrap(inputs[1])
          .clear()
          .type(room.name);
      });
    });

    // Add room
    cy.contains('button', 'signup.configureHouse.addRoomButton').click();

    const serverUrl = Cypress.env('serverUrl');
    cy.intercept(
      {
        method: 'POST',
        url: `${serverUrl}/api/v1/house/room/${house.rooms[0].selector}`
      },
      req => {
        req.reply(res => {
          const house = Cypress.env('house');
          house.rooms[0] = res.body;
          Cypress.env('house', house);
        });
      }
    );

    // Submit form
    cy.contains('button', 'signup.configureHouse.saveHouse').click();

    // Check redirected to preference page
    cy.location('pathname').should('eq', '/signup/success');
  });

  it('Setup success - done', () => {
    // Submit form
    cy.contains('signup.success.goToDashboardButton').click();

    // Check redirected to house page
    cy.location('pathname').should('eq', '/dashboard');
  });
});
