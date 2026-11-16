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
      .i18n('calendar.noCalendarsConnected.title')
      .i18n('calendar.noCalendarsConnected.installIntegration')
      .i18n('calendar.noCalendarsConnected.sharedCalendars');
    cy.get('[data-cy=calendar-integration-link]').should('not.exist');
    cy.get('[data-cy=calendar-catalog-link]').click();
    cy.location('pathname').should('eq', '/dashboard/integration');
    cy.location('search').should('eq', '?search=calendar');
  });

  it('links the installed calendar integrations to enable', () => {
    cy.intercept('GET', '**/api/v1/calendar', []);
    cy.intercept('GET', '**/api/v1/external_integration', [deviceIntegration, calendarIntegration]);
    cy.visit('/dashboard/calendar');

    cy.get(NOTICE).i18n('calendar.noCalendarsConnected.enableInstalled');
    cy.get('[data-cy=calendar-integration-link]')
      .should('have.length', 1)
      .and('contain', 'Holidays')
      .and('have.attr', 'href', '/dashboard/integration/device/external/ext-dev-holidays/config');
    cy.get('[data-cy=calendar-catalog-link]').should('exist');
  });

  it('shows no notice once the user has a calendar', () => {
    const calendarId = 'a1b2c3d4-0000-4000-8000-000000000001';
    const now = new Date();
    cy.intercept('GET', '**/api/v1/calendar/event*', [
      {
        name: 'Dentist',
        calendar_id: calendarId,
        start: now.toISOString(),
        end: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
        full_day: false
      }
    ]);
    cy.intercept('GET', '**/api/v1/calendar', [
      { id: calendarId, name: 'Personal', selector: 'personal', color: '#3366ff' }
    ]).as('getCalendars');
    cy.intercept('GET', '**/api/v1/external_integration', [calendarIntegration]).as('getIntegrations');
    cy.visit('/dashboard/calendar');

    // the calendar grid renders before its requests answer: wait for both,
    // then for the event, stored with the calendars in the same update, so
    // the absence of the notice is checked on the loaded page
    cy.wait(['@getCalendars', '@getIntegrations']);
    cy.contains('.rbc-event', 'Dentist').should('exist');
    cy.get(NOTICE).should('not.exist');
  });
});
