// The logged-out pages on a phone (docs/specs/mobile-pages/auth.md): the sign-in, the password
// recovery, the new password and the keypad of an armed house.
//
// The sign-in runs against the instance, like the desktop spec next door. The requests of the
// password recovery and of the keypad are stubbed: they are rate limited, send messages or need
// an armed house — stubbed, the spec checks what the phone layout shows and sends.
describe('Logged-out pages on a phone', () => {
  const serverUrl = Cypress.env('serverUrl');

  const expectNoSidewaysScroll = () => {
    cy.document().then(doc => {
      expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth);
    });
  };

  before(() => {
    // the account exists
    cy.login();
    cy.clearLocalStorage();
  });

  beforeEach(() => {
    cy.viewport('iphone-x');
  });

  describe('Sign-in', () => {
    it('should give each field its keyboard and the action in the bottom bar', () => {
      cy.visit('/login');
      cy.get('[data-cy=login-mobile]').should('be.visible');
      cy.get('[data-cy=login-email]')
        .should('have.attr', 'type', 'email')
        .and('have.attr', 'autocomplete', 'username')
        .and('have.attr', 'autocapitalize', 'off')
        .and('have.css', 'font-size', '16px');
      cy.get('[data-cy=login-password]')
        .should('have.attr', 'type', 'password')
        .and('have.attr', 'autocomplete', 'current-password')
        .and('have.css', 'font-size', '16px');
      cy.get('[data-cy=login-submit]')
        .should('be.visible')
        .i18n('login.loginButtonText');
      cy.get('[data-cy=login-forgot-password]')
        .invoke('outerHeight')
        .should('be.at.least', 44);
      expectNoSidewaysScroll();
    });

    it('should show a refused e-mail next to its field and a refused login above the button', () => {
      cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/login` }).as('login');
      cy.visit('/login');

      // not an e-mail address: said next to the field, which takes the focus — nothing is sent
      cy.get('[data-cy=login-email]').type('not-an-email');
      cy.get('[data-cy=login-submit]').click();
      cy.get('[data-cy=login-mobile] [role=alert]')
        .should('have.length', 1)
        .i18n('login.invalidEmail');
      cy.focused()
        .should('have.attr', 'data-cy', 'login-email')
        .and('have.attr', 'aria-describedby', 'login-email-error');
      cy.get('#login-email-error').i18n('login.invalidEmail');
      cy.get('@login.all').should('have.length', 0);

      // the password can be read while it is typed
      cy.get('[data-cy=login-email]').clear();
      cy.get('[data-cy=login-email]').type('nobody@gladysassistant.com');
      cy.get('[data-cy=login-password]').type('not-the-password');
      cy.get('[data-cy=login-password-reveal]')
        .should('have.attr', 'aria-pressed', 'false')
        .click();
      cy.get('[data-cy=login-password]')
        .should('have.attr', 'type', 'text')
        .and('have.value', 'not-the-password');
      cy.get('[data-cy=login-password-reveal]').should('have.attr', 'aria-pressed', 'true');

      // the keyboard's key submits the form
      cy.get('[data-cy=login-password]').type('{enter}');
      cy.wait('@login')
        .its('request.body')
        .should('deep.equal', { email: 'nobody@gladysassistant.com', password: 'not-the-password' });
      cy.get('[data-cy=mobile-bottom-bar-error]')
        .should('be.visible')
        .i18n('login.wrongCredentials');
      // the refusal can be closed, and comes back with the next one
      cy.get('[data-cy=mobile-bottom-bar-error] button').click();
      cy.get('[data-cy=mobile-bottom-bar-error]').should('not.exist');
      cy.get('[data-cy=login-submit]').click();
      cy.get('[data-cy=mobile-bottom-bar-error]').should('be.visible');
    });

    it('should say that Gladys is unreachable, not that the password is wrong', () => {
      const { tony } = Cypress.env('users');
      cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/login` }, { forceNetworkError: true }).as('login');
      cy.visit('/login');
      cy.get('[data-cy=login-email]').type(tony.email);
      cy.get('[data-cy=login-password]').type(tony.password);
      cy.get('[data-cy=login-submit]').click();
      cy.wait('@login');
      cy.get('[data-cy=mobile-bottom-bar-error]')
        .should('be.visible')
        .i18n('login.unreachable');
      expectNoSidewaysScroll();
    });

    it('should log in and go to the page that was asked for', () => {
      const { tony } = Cypress.env('users');
      cy.visit(`/login?return_url=${encodeURIComponent('/dashboard/chat')}`);
      cy.get('[data-cy=login-email]').type(tony.email);
      cy.get('[data-cy=login-password]').type(tony.password);
      cy.get('[data-cy=login-submit]').click();
      cy.location('pathname').should('eq', '/dashboard/chat');
    });

    it('should keep the card on a wider screen', () => {
      cy.viewport(1280, 800);
      cy.visit('/login');
      cy.contains('button', 'login.loginButtonText').should('be.visible');
      cy.get('[data-cy=login-mobile]').should('not.exist');
    });
  });

  describe('Password recovery', () => {
    beforeEach(() => {
      cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/forgot_password` }, { body: { success: true } }).as(
        'forgotPassword'
      );
    });

    it('should ask for the e-mail address, then for the one-time code', () => {
      cy.intercept(
        { method: 'POST', url: `${serverUrl}/api/v1/forgot_password/code` },
        { body: { access_token: 'reset-token' } }
      ).as('verifyCode');
      cy.visit('/login');
      cy.get('[data-cy=login-forgot-password]').click();
      cy.location('pathname').should('eq', '/forgot-password');
      cy.get('[data-cy=forgot-password-mobile]').should('be.visible');

      // refused before it is sent
      cy.get('[data-cy=forgot-password-submit]').click();
      cy.get('[data-cy=forgot-password-mobile] [role=alert]').i18n('forgotPassword.wrongEmailError');
      cy.get('@forgotPassword.all').should('have.length', 0);

      cy.get('[data-cy=forgot-password-email]')
        .should('have.css', 'font-size', '16px')
        .type('tony.stark@gladysassistant.com');
      cy.get('[data-cy=forgot-password-submit]').click();
      cy.wait('@forgotPassword')
        .its('request.body')
        .should('deep.equal', { email: 'tony.stark@gladysassistant.com', origin: Cypress.config('baseUrl') });

      cy.get('[data-cy=forgot-password-sent]')
        .should('be.visible')
        .i18n('forgotPassword.success');
      cy.get('[data-cy=forgot-password-code]')
        .should('have.attr', 'autocomplete', 'one-time-code')
        .and('have.attr', 'autocapitalize', 'characters');
      // an empty code is refused next to its field
      cy.get('[data-cy=forgot-password-code-submit]').click();
      cy.get('[data-cy=forgot-password-mobile] [role=alert]').i18n('forgotPassword.codeInvalid');
      cy.get('@verifyCode.all').should('have.length', 0);
      expectNoSidewaysScroll();

      // a code the server refuses: said next to its field, which takes the focus once the answer
      // is there
      cy.intercept(
        { method: 'POST', url: `${serverUrl}/api/v1/forgot_password/code` },
        { statusCode: 401, body: {} }
      ).as('refusedCode');
      // no session: the token refresh the http client tries after a 401 is refused, as it is by
      // the instance — that refusal is what the page gets
      cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/access_token` }, { statusCode: 400, body: {} });
      cy.get('[data-cy=forgot-password-code]').type('WRONG');
      cy.get('[data-cy=forgot-password-code-submit]').click();
      cy.wait('@refusedCode');
      cy.get('[data-cy=forgot-password-mobile] [role=alert]').i18n('forgotPassword.codeInvalid');
      cy.focused().should('have.attr', 'data-cy', 'forgot-password-code');
      cy.get('[data-cy=forgot-password-code]').clear();
      cy.intercept(
        { method: 'POST', url: `${serverUrl}/api/v1/forgot_password/code` },
        { body: { access_token: 'reset-token' } }
      ).as('verifyCode');

      // asking for a new code keeps the code screen, and what was typed on it
      cy.get('[data-cy=forgot-password-code]').type('ABCD-1234');
      cy.intercept(
        { method: 'POST', url: `${serverUrl}/api/v1/forgot_password` },
        { body: { success: true }, delay: 400 }
      ).as('resend');
      cy.get('[data-cy=forgot-password-send-again]').click();
      cy.get('[data-cy=forgot-password-send-again]').should('be.disabled');
      cy.get('[data-cy=forgot-password-code]')
        .should('be.visible')
        .and('have.value', 'ABCD-1234');
      cy.get('[data-cy=forgot-password-email]').should('not.exist');
      cy.wait('@resend');
      cy.get('[data-cy=forgot-password-send-again]').should('not.be.disabled');

      cy.get('[data-cy=forgot-password-code-submit]').click();
      cy.wait('@verifyCode')
        .its('request.body')
        .should('deep.equal', { email: 'tony.stark@gladysassistant.com', code: 'ABCD-1234' });
      cy.location('pathname').should('eq', '/reset-password');
      cy.location('search').should('eq', '?token=reset-token');
      cy.get('[data-cy=reset-password-mobile]').should('be.visible');
    });

    it('should show a refusal of the server above the button and lead back to the sign-in', () => {
      cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/forgot_password` }, { statusCode: 404, body: {} });
      cy.visit('/forgot-password');
      cy.get('[data-cy=forgot-password-email]').type('nobody@gladysassistant.com');
      cy.get('[data-cy=forgot-password-submit]').click();
      cy.get('[data-cy=mobile-bottom-bar-error]')
        .should('be.visible')
        .i18n('forgotPassword.userNotFound');
      cy.get('[data-cy=mobile-nav-back]').click();
      cy.location('pathname').should('eq', '/login');
    });
  });

  describe('New password', () => {
    it('should refuse a short or a different password next to its field, then reset it', () => {
      cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/reset_password` }, { body: { success: true } }).as(
        'resetPassword'
      );
      cy.visit('/reset-password?token=reset-token');
      cy.get('[data-cy=reset-password-mobile]').should('be.visible');
      cy.get('[data-cy=reset-password-password]')
        .should('have.attr', 'autocomplete', 'new-password')
        .and('have.css', 'font-size', '16px');

      cy.get('[data-cy=reset-password-password]').type('short');
      cy.get('[data-cy=reset-password-password-repeat]').type('other');
      cy.get('[data-cy=reset-password-submit]').click();
      cy.get('[data-cy=reset-password-mobile] [role=alert]')
        .should('have.length', 2)
        .first()
        .i18n('resetPassword.passwordTooShort');
      cy.get('[data-cy=reset-password-mobile]').i18n('resetPassword.passwordRepeatError');
      cy.focused().should('have.attr', 'data-cy', 'reset-password-password');
      cy.get('@resetPassword.all').should('have.length', 0);

      cy.get('[data-cy=reset-password-password]').clear();
      cy.get('[data-cy=reset-password-password]').type('a-long-password');
      cy.get('[data-cy=reset-password-password-repeat]').clear();
      cy.get('[data-cy=reset-password-password-repeat]').type('a-long-password');
      cy.get('[data-cy=reset-password-submit]').click();
      cy.wait('@resetPassword').then(({ request }) => {
        expect(request.body).to.deep.equal({ password: 'a-long-password' });
        expect(request.headers.authorization).to.equal('Bearer reset-token');
      });
      cy.get('[data-cy=reset-password-success]')
        .should('be.visible')
        .i18n('resetPassword.success');
      cy.get('[data-cy=reset-password-login]').should('have.attr', 'href', '/login');
    });

    it('should offer another link when this one is dead', () => {
      cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/reset_password` }, { statusCode: 400, body: {} });
      cy.visit('/reset-password?token=dead-token');
      cy.get('[data-cy=reset-password-password]').type('a-long-password');
      cy.get('[data-cy=reset-password-password-repeat]').type('a-long-password');
      cy.get('[data-cy=reset-password-submit]').click();
      cy.get('[data-cy=reset-password-error]')
        .should('be.visible')
        .i18n('resetPassword.resetTokenNotFound');
      cy.get('[data-cy=reset-password-password]').should('not.exist');
      cy.get('[data-cy=reset-password-new-link]').should('have.attr', 'href', '/forgot-password');
    });
  });

  describe('Keypad of an armed house', () => {
    beforeEach(() => {
      // a real session: its websocket and its tokens are the ones of the instance
      cy.login();
    });

    // The page of a locked tablet: the instance refuses its session for the dashboard (the
    // probe the page sends first), the house to disarm is the one tablet mode was set for
    const visitLocked = () => {
      cy.intercept({ method: 'POST', url: `${serverUrl}/api/v1/access_token` }, req => {
        if (req.body.scope.length === 1 && req.body.scope[0] === 'dashboard:write') {
          req.reply({ statusCode: 401, body: { message: 'TABLET_IS_LOCKED' } });
        } else {
          req.continue();
        }
      });
      cy.visit('/locked', {
        onBeforeLoad: win => {
          win.localStorage.setItem('current_house_selector', 'my-house');
        }
      });
    };

    it('should type a code on keys a thumb cannot miss, without the keyboard of the phone', () => {
      visitLocked();
      cy.get('[data-cy=locked-mobile]').should('be.visible');
      cy.get('[data-cy=locked-keypad] button').should('have.length', 11);
      cy.get('[data-cy=locked-keypad] button').each($key => {
        expect($key.outerHeight()).to.be.at.least(44);
        expect($key.outerWidth()).to.be.at.least(44);
      });
      // not a password field (a password manager would offer to save the code of the alarm), and
      // no keyboard of the phone
      cy.get('[data-cy=locked-code]')
        .should('have.attr', 'type', 'text')
        .and('have.attr', 'inputmode', 'none')
        .and('have.attr', 'readonly');
      cy.get('[data-cy=locked-key-delete]').should('be.disabled');

      cy.get('[data-cy=locked-key-1]').click();
      cy.get('[data-cy=locked-key-0]').click();
      cy.get('[data-cy=locked-key-9]').click();
      // one dot per digit: the code itself is never in the page
      cy.get('[data-cy=locked-code]')
        .should('have.value', '•••')
        .and('have.attr', 'data-length', '3');
      cy.get('[data-cy=locked-key-delete]').click();
      cy.get('[data-cy=locked-code]').should('have.value', '••');
      // the whole keypad is on the screen: nothing to scroll, in either direction
      cy.document().then(doc => {
        expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth);
        expect(doc.documentElement.scrollHeight).to.be.at.most(doc.documentElement.clientHeight);
      });
    });

    it('should send the code, say a wrong one next to it and a blocked keypad above the button', () => {
      visitLocked();
      cy.get('[data-cy=locked-mobile]').should('be.visible');
      cy.intercept(
        { method: 'POST', url: `${serverUrl}/api/v1/house/my-house/disarm_with_code` },
        { statusCode: 403, body: { message: 'INVALID_CODE' } }
      ).as('disarm');
      cy.get('[data-cy=locked-key-4]').click();
      cy.get('[data-cy=locked-key-2]').click();
      cy.get('[data-cy=locked-validate]').click();
      cy.wait('@disarm')
        .its('request.body')
        .should('deep.equal', { code: '42' });
      cy.get('[data-cy=locked-mobile] [role=alert]')
        .should('be.visible')
        .i18n('locked.wrongCodeError');
      // the code starts again, and its field points to the error
      cy.get('[data-cy=locked-code]')
        .should('have.value', '')
        .and('have.attr', 'aria-invalid', 'true')
        .and('have.attr', 'aria-describedby', 'locked-code-error');

      cy.intercept(
        { method: 'POST', url: `${serverUrl}/api/v1/house/my-house/disarm_with_code` },
        { statusCode: 429, body: { properties: { time_before_next: 3 * 60 * 1000 } } }
      );
      cy.get('[data-cy=locked-key-7]').click();
      cy.get('[data-cy=locked-validate]').click();
      cy.get('[data-cy=mobile-bottom-bar-error]')
        .should('be.visible')
        .and('contain', '3');
    });

    it('should keep the card on a wider screen', () => {
      cy.viewport(1280, 800);
      visitLocked();
      cy.contains('button', 'locked.validateButton').should('be.visible');
      cy.get('[data-cy=locked-mobile]').should('not.exist');
    });
  });
});
