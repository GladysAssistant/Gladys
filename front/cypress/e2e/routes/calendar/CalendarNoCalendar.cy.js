// The notice of the calendar page while the user sees no calendar: it points
// at the calendar integrations to enable, else at the catalog. The calendars
// and the installed integrations are stubbed, everything else is the real app.
const NOTICE = '[data-cy=calendar-no-calendar-connected]';

const calendarIntegration = {
  id: '6c1b3f0e-2a4d-4b8e-9f3a-1d2c3b4a5e03',
  name: 'Holidays',
  selector: 'ext-dev-holidays',
  type: 'external',
  status: 'RUNNING',
  manifest: { name: 'Holidays', type: 'calendar', version: '1.0.0' }
};

const deviceIntegration = {
  id: '6c1b3f0e-2a4d-4b8e-9f3a-1d2c3b4a5e04',
  name: 'Lights',
  selector: 'ext-dev-lights',
  type: 'external',
  status: 'RUNNING',
  manifest: { name: 'Lights', type: 'device', version: '1.0.0' }
};

describe('Calendar - no calendar connected', () => {
  beforeEach(() => {
    cy.login();
    cy.intercept('GET', '**/api/v1/calendar/event*', []);
  });

  it('points an admin without calendar integration at the catalog', () => {
    cy.intercept('GET', '**/api/v1/calendar', []);
    cy.intercept('GET', '**/api/v1/external_integration', [deviceIntegration]);
    cy.visit('/dashboard/calendar');

    cy.get(NOTICE)
      .should('contain', 'calendar.noCalendarsConnected.title')
      .and('contain', 'calendar.noCalendarsConnected.installIntegration')
      .and('contain', 'calendar.noCalendarsConnected.sharedCalendars');
    cy.get('[data-cy=calendar-integration-link]').should('not.exist');
    cy.get('[data-cy=calendar-catalog-link]').click();
    cy.location('pathname').should('eq', '/dashboard/integration');
    cy.location('search').should('eq', '?search=calendar');
  });

  it('links the installed calendar integrations to enable', () => {
    cy.intercept('GET', '**/api/v1/calendar', []);
    cy.intercept('GET', '**/api/v1/external_integration', [deviceIntegration, calendarIntegration]);
    cy.visit('/dashboard/calendar');

    cy.get(NOTICE).should('contain', 'calendar.noCalendarsConnected.enableInstalled');
    cy.get('[data-cy=calendar-integration-link]')
      .should('have.length', 1)
      .and('contain', 'Holidays')
      .and('have.attr', 'href', '/dashboard/integration/device/external/ext-dev-holidays/config');
    cy.get('[data-cy=calendar-catalog-link]').should('exist');
  });

  it('shows no notice once the user has a calendar', () => {
    cy.intercept('GET', '**/api/v1/calendar', [
      { id: 'a1b2c3d4-0000-4000-8000-000000000001', name: 'Personal', selector: 'personal', color: '#3366ff' }
    ]);
    cy.intercept('GET', '**/api/v1/external_integration', [calendarIntegration]);
    cy.visit('/dashboard/calendar');

    cy.get('.rbc-calendar').should('exist');
    cy.get(NOTICE).should('not.exist');
  });
});
