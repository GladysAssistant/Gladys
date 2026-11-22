// The yearly community survey notice of the navigation rail (components/header/SurveyNotice.jsx,
// utils/survey.js): shown to admins until the survey closes, never on a wall tablet, and hidden for
// good once the user hides it or opens the form.
describe('Survey notice', () => {
  const notice = '[data-cy=survey-notice]';
  const DISMISSED_KEY = 'gladys_assistant_v1_dismissed_survey_notice';
  const TABLET_MODE_KEY = 'current_house_selector';

  const visitDashboard = ({ tabletMode = false } = {}) => {
    cy.visit('/dashboard', {
      onBeforeLoad(win) {
        win.localStorage.removeItem(DISMISSED_KEY);
        if (tabletMode) {
          win.localStorage.setItem(TABLET_MODE_KEY, Cypress.env('house').selector);
        } else {
          win.localStorage.removeItem(TABLET_MODE_KEY);
        }
      }
    });
    cy.get('[data-cy=sidebar-nav]').should('exist');
  };

  beforeEach(() => {
    cy.login();
  });

  afterEach(() => {
    cy.window().then(win => {
      win.localStorage.removeItem(DISMISSED_KEY);
      win.localStorage.removeItem(TABLET_MODE_KEY);
    });
  });

  it('Should invite the admin to the survey in their language, tagged as coming from Gladys', () => {
    const i18n = Cypress.env('i18n');
    // French users get the French form, everyone else the English one
    const form = Cypress.env('language') === 'fr' ? 'https://tally.so/r/bZWkq6' : 'https://tally.so/r/1W9Kk1';
    visitDashboard();
    cy.get(notice)
      .should('be.visible')
      .and('contain', i18n.header.surveyNoticeTitle)
      .and('contain', i18n.header.surveyNoticeText);
    cy.get('[data-cy=survey-notice-link]')
      .should('have.attr', 'href', `${form}?source=app`)
      .and('have.attr', 'target', '_blank')
      .and('have.attr', 'rel', 'noopener noreferrer');
  });

  it('Should stay hidden once the user hides it', () => {
    visitDashboard();
    cy.get('[data-cy=survey-notice-dismiss]').click();
    cy.get(notice).should('not.exist');
    // the dismissal is kept: the notice does not come back on the next visit
    cy.reload();
    cy.get('[data-cy=sidebar-nav]').should('exist');
    cy.get(notice).should('not.exist');
  });

  it('Should hide itself once the user opens the form', () => {
    visitDashboard();
    cy.get('[data-cy=survey-notice-link]')
      // the form opens in a new tab, which the test browser cannot follow: only the app's own
      // click handler must run
      .then($link => $link.on('click', e => e.preventDefault()))
      .click();
    cy.get(notice).should('not.exist');
  });

  it('Should not show up on a wall tablet', () => {
    visitDashboard({ tabletMode: true });
    // the rail is there, and the other notices could be: only the survey one is left out
    cy.get('[data-cy=sidebar-nav]').should('exist');
    cy.get(notice).should('not.exist');
  });

  it('Should disappear once the survey is closed', () => {
    // only the date moves forward: the timers of the page keep running
    cy.clock(new Date('2027-01-02T12:00:00+01:00').getTime(), ['Date']);
    visitDashboard();
    cy.get(notice).should('not.exist');
  });
});
