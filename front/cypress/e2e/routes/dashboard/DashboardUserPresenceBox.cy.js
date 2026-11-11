const NOW = new Date('2026-10-19T10:00:00Z').getTime();
const HOUR = 60 * 60 * 1000;
const labels = () => Cypress.env('i18n').dashboard.boxes.userPresence;
const durations = {
  en: ['7 hours', 'a minute', 'an hour', '2 days', '5 minutes', '6 minutes'],
  de: ['7 Stunden', 'einer Minute', 'einer Stunde', '2 Tagen', '5 Minuten', '6 Minuten'],
  fr: ['7 heures', 'une minute', 'une heure', '2 jours', '5 minutes', '6 minutes'],
  es: ['7 horas', 'un minuto', 'una hora', '2 días', '5 minutos', '6 minutos']
};
const since = index => labels().since.replace('{{duration}}', durations[Cypress.env('language')][index]);
const users = [
  {
    selector: 'alina',
    firstname: 'Alina',
    lastname: 'Example',
    current_house_id: null,
    last_house_changed: new Date(NOW - 7 * HOUR).toISOString()
  },
  {
    selector: 'stefan',
    firstname: 'Stefan',
    lastname: 'Example',
    current_house_id: 'house',
    last_house_changed: new Date(NOW - HOUR).toISOString()
  },
  { selector: 'unknown', firstname: 'Unknown', current_house_id: null, last_house_changed: null }
];

describe('Dashboard user presence box', () => {
  let selector;

  beforeEach(() => {
    cy.login();
    cy.viewport(1280, 900);
    cy.clock(NOW, ['Date', 'setInterval', 'clearInterval']);
    // Presence fixtures only: dashboard persistence, editor and viewer are real.
    cy.intercept(
      'GET',
      '**/api/v1/user?fields=firstname,lastname,role,selector,picture,current_house_id,last_house_changed',
      users
    ).as('presenceUsers');
    cy.intercept('GET', '**/api/v1/user', users);
    cy.intercept('GET', '**/api/v1/me', req => {
      delete req.headers['if-none-match'];
      req.continue(res => {
        res.body.language = Cypress.env('language');
      });
    });
    cy.request({
      method: 'POST',
      url: `${Cypress.env('serverUrl')}/api/v1/dashboard`,
      body: {
        name: 'Presence',
        type: 'main',
        visibility: 'private',
        boxes: [{ columns: [[{ type: 'user-presence' }]] }]
      }
    }).then(res => {
      selector = res.body.selector;
      cy.visit(`/dashboard/${selector}`);
    });
    cy.wait('@presenceUsers');
    cy.contains('.card-title', 'dashboard.boxTitle.user-presence')
      .closest('.card')
      .as('presence');
  });

  afterEach(() => {
    if (selector) {
      cy.request({ method: 'DELETE', url: `${Cypress.env('serverUrl')}/api/v1/dashboard/${selector}` });
      selector = null;
    }
  });

  it('keeps legacy defaults and displays localized durations separately, including live updates', () => {
    cy.get('@presence')
      .contains('li', 'Alina')
      .as('away');
    cy.get('@away')
      .find('.badge')
      .should('have.text', labels().away);
    cy.get('@away')
      .find('small')
      .should('have.text', since(0))
      .then($time => {
        const badge = $time.siblings('.badge')[0].getBoundingClientRect();
        expect($time[0].getBoundingClientRect().top).to.be.at.least(badge.bottom);
      });
    cy.get('@presence').should('not.contain', 'Example');
    cy.get('@presence')
      .contains('li', 'Stefan')
      .find('small')
      .should('not.exist');
    cy.get('@presence')
      .contains('li', 'Unknown')
      .find('.badge')
      .should('have.text', labels().neverSeenAtHome);
    cy.get('@presence')
      .contains('li', 'Unknown')
      .find('small')
      .should('not.exist');
    if (Cypress.env('presenceScreenshots')) cy.get('@presence').screenshot('presence-default');

    [60 * 1000, HOUR, 48 * HOUR, 5 * 60 * 1000].forEach((elapsed, index) => {
      cy.sendWebSocket({
        type: 'user.left-home',
        payload: {
          selector: 'alina',
          current_house_id: null,
          last_house_changed: new Date(NOW - elapsed).toISOString()
        }
      });
      cy.get('@away')
        .find('small')
        .should('have.text', since(index + 1));
    });
    cy.tick(60 * 1000);
    cy.get('@away')
      .find('small')
      .should('have.text', since(5));
    cy.sendWebSocket({
      type: 'user.back-home',
      payload: { selector: 'alina', current_house_id: 'house', last_house_changed: new Date(NOW).toISOString() }
    });
    cy.get('@away')
      .find('.badge')
      .should('have.text', labels().atHome);
    cy.get('@away')
      .find('small')
      .should('not.exist');
  });

  it('distinguishes matching first names, persists the selected user and shows everyone when cleared', () => {
    const sharedNameUsers = users.map(user => (user.selector === 'stefan' ? { ...user, firstname: 'Alina' } : user));
    cy.intercept('GET', '**/api/v1/user', sharedNameUsers);
    cy.intercept(
      'GET',
      '**/api/v1/user?fields=firstname,lastname,role,selector,picture,current_house_id,last_house_changed',
      sharedNameUsers
    ).as('sharedNamePresenceUsers');
    cy.reload();
    cy.wait('@sharedNamePresenceUsers');
    cy.get('@presence')
      .find('li')
      .should('have.length', 3);
    cy.get('[data-cy="edit-dashboard-button"]').click();
    cy.get('[data-cy="edit-box-0-0"]').click();
    cy.get('[data-cy="edit-panel"] .react-select__control').click();
    cy.contains('.react-select__option', 'Alina (alina)').should('be.visible');
    cy.contains('.react-select__option', 'Unknown').should('be.visible');
    cy.contains('.react-select__option', 'Alina (stefan)').click({ scrollBehavior: false });
    cy.get('@presence')
      .find('li')
      .should('have.length', 1)
      .find('.badge')
      .should('have.text', labels().atHome);
    cy.contains('button', 'dashboard.editDashboardSaveButton').click();
    cy.get('[data-cy="dashboard-saved-label"]').should('be.visible');
    cy.request({ method: 'GET', url: `${Cypress.env('serverUrl')}/api/v1/dashboard/${selector}` }).then(({ body }) => {
      expect(body.boxes[0].columns[0][0].users).to.deep.equal(['stefan']);
    });
    cy.reload();
    cy.get('@presence')
      .find('li')
      .should('have.length', 1)
      .find('.badge')
      .should('have.text', labels().atHome);
    cy.get('[data-cy="edit-box-0-0"]').click();
    cy.get('[data-cy="edit-panel"] .react-select__multi-value__label').should('have.text', 'Alina (stefan)');
    cy.get('[data-cy="edit-panel"] .react-select__clear-indicator').click();
    cy.get('@presence')
      .find('li')
      .should('have.length', 3);
    cy.contains('button', 'dashboard.editDashboardSaveButton').click();
    cy.get('[data-cy="dashboard-saved-label"]').should('be.visible');
    cy.reload();
    cy.get('@presence')
      .find('li')
      .should('have.length', 3);
    cy.get('@presence')
      .should('contain', 'Alina')
      .and('contain', 'Unknown');
  });

  it('previews and persists independent duration switches and last names with fixed localized labels', () => {
    cy.get('[data-cy="edit-dashboard-button"]').click();
    cy.get('[data-cy="edit-box-0-0"]').click();
    cy.get('[data-cy="edit-panel"] input[type="checkbox"]').should('have.length', 3);
    cy.get('[data-cy="edit-panel"] input[name^="presence_"][type="text"]').should('not.exist');
    cy.get('input[name="presence_show_lastname"]')
      .should('not.be.checked')
      .check({ force: true });
    cy.get('input[name="presence_show_home_since"]')
      .should('not.be.checked')
      .check({ force: true });
    cy.get('input[name="presence_show_away_since"]')
      .should('be.checked')
      .uncheck({ force: true });
    cy.get('@presence')
      .contains('li', 'Stefan Example')
      .as('home');
    cy.get('@home')
      .find('.badge')
      .should('have.text', labels().atHome);
    cy.get('@home')
      .find('small')
      .should('have.text', since(2));
    cy.get('@presence')
      .contains('li', 'Alina Example')
      .find('small')
      .should('not.exist');
    cy.get('@presence')
      .contains('li', 'Unknown')
      .find('.badge')
      .should('have.text', labels().neverSeenAtHome);
    if (Cypress.env('presenceScreenshots')) cy.get('[data-cy="edit-panel"]').screenshot('presence-settings');
    cy.contains('button', 'dashboard.editDashboardSaveButton').click();
    cy.get('[data-cy="dashboard-saved-label"]').should('be.visible');
    cy.reload();
    cy.get('[data-cy="edit-box-0-0"]').click();
    cy.get('input[name="presence_show_lastname"]').should('be.checked');
    cy.get('input[name="presence_show_home_since"]').should('be.checked');
    cy.get('input[name="presence_show_away_since"]').should('not.be.checked');
    cy.get('input[name="presence_show_away_since"]').check({ force: true });
    cy.get('input[name="presence_show_home_since"]').uncheck({ force: true });
    cy.get('@presence')
      .contains('li', 'Stefan')
      .find('small')
      .should('not.exist');
    cy.get('@presence')
      .contains('li', 'Stefan')
      .find('.badge')
      .should('have.text', labels().atHome);
    cy.get('@presence')
      .contains('li', 'Alina')
      .find('.badge')
      .should('have.text', labels().away);
    cy.get('@presence')
      .contains('li', 'Alina')
      .find('small')
      .should('have.text', since(0));
  });

  it('keeps names and localized labels within narrow cards and allows both durations to be visible', () => {
    cy.get('[data-cy="edit-dashboard-button"]').click();
    cy.get('[data-cy="edit-box-0-0"]').click();
    cy.get('input[name="presence_show_lastname"]').check({ force: true });
    cy.get('input[name="presence_show_home_since"]').check({ force: true });
    cy.contains('button', 'dashboard.editDashboardSaveButton').click();
    cy.get('[data-cy="dashboard-saved-label"]').should('be.visible');
    cy.contains('button', 'dashboard.editDashboardDoneButton').click();
    cy.viewport(375, 812);
    cy.get('@presence')
      .contains('li', 'Alina')
      .find('small')
      .should('have.text', since(0));
    cy.get('@presence')
      .contains('li', 'Stefan')
      .find('small')
      .should('have.text', since(2));
    cy.get('@presence')
      .find('li, .badge')
      .each($el => {
        const rect = $el[0].getBoundingClientRect();
        expect(rect.left).to.be.at.least(0);
        expect(rect.right).to.be.at.most(375);
        expect($el[0].scrollWidth).to.be.at.most($el[0].clientWidth + 1);
      });
    if (Cypress.env('presenceScreenshots')) cy.get('@presence').screenshot('presence-narrow');
  });
});
