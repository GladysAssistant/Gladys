const getStoredUser = () => JSON.parse(window.localStorage.getItem('user'));

describe('Profile', () => {
  beforeEach(() => {
    cy.login();
  });

  it('Sends the new password without keeping it in the stored user', () => {
    const { tony } = Cypress.env('users');
    cy.intercept('PATCH', '**/api/v1/me').as('saveProfile');
    cy.visit('/dashboard/profile');
    cy.get('.dimmer.active').should('not.exist');

    // Tony's current password: the next specs still log in with it
    cy.get('input[type=password]').then(inputs => {
      cy.wrap(inputs[0]).type(tony.password);
      cy.wrap(inputs[1]).type(tony.password);
    });
    cy.contains('button', 'profile.saveButton').click();

    cy.wait('@saveProfile')
      .its('request.body.password')
      .should('eq', tony.password);

    cy.get('.dimmer.active').should('not.exist');
    cy.get('input[type=password]').each(input => cy.wrap(input).should('have.value', ''));
    cy.wrap(null).should(() => {
      const storedUser = getStoredUser();
      expect(storedUser).to.have.property('access_token');
      expect(storedUser).not.to.have.property('password');
      expect(storedUser).not.to.have.property('passwordRepeat');
    });
  });

  it('Removes a password stored by an older version on start', () => {
    cy.then(() => {
      window.localStorage.setItem(
        'user',
        JSON.stringify({ ...getStoredUser(), password: 'old-password', passwordRepeat: 'old-password' })
      );
    });
    cy.visit('/dashboard/profile');
    cy.get('.dimmer.active').should('not.exist');

    cy.wrap(null).should(() => {
      const storedUser = getStoredUser();
      expect(storedUser).to.have.property('access_token');
      expect(storedUser).not.to.have.property('password');
      expect(storedUser).not.to.have.property('passwordRepeat');
    });
  });
});
