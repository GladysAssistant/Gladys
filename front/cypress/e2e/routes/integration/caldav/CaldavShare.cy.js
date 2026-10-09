// The CalDAV sharing page lists the calendars of the CalDAV service, and the
// calendar route also returns the calendars other household members share.
// Only the owner of a calendar can change its sharing: the page must list the
// user's own calendars only, or saving would PATCH a calendar of someone else
// (403) and fail the whole save. The calendar route is stubbed (a second user
// with a synchronized CalDAV account would be needed), the rest is the real app.
const SHARE_URL = '/dashboard/integration/calendar/caldav/share';
const OTHER_USER_ID = '0cd30aef-9c4e-4a23-88e3-3547971296e5';

describe('CalDAV - sharing page', () => {
  beforeEach(() => {
    cy.login();

    cy.intercept({ method: 'GET', pathname: '/api/v1/calendar' }, req => {
      const { id: myUserId } = JSON.parse(window.localStorage.getItem('user'));
      req.reply([
        {
          id: 'a1d6c6f2-3c1e-4a8f-9f43-0b6b0f7c1a01',
          name: 'My CalDAV calendar',
          selector: 'my-caldav-calendar',
          user_id: myUserId,
          shared: false
        },
        {
          id: 'a1d6c6f2-3c1e-4a8f-9f43-0b6b0f7c1a02',
          name: 'Calendar shared by another member',
          selector: 'calendar-shared-by-another-member',
          user_id: OTHER_USER_ID,
          shared: true
        }
      ]);
    }).as('getCalendars');
    cy.intercept('PATCH', '**/api/v1/calendar/*', req => {
      req.reply({ selector: req.url.split('/').pop(), ...req.body });
    }).as('patchCalendar');
  });

  it('only lists and saves the calendars of the user', () => {
    cy.visit(SHARE_URL);
    cy.wait('@getCalendars');

    cy.contains('label', 'My CalDAV calendar').should('exist');
    cy.contains('label', 'Calendar shared by another member').should('not.exist');

    cy.contains('label', 'My CalDAV calendar').click();
    cy.contains('button', 'integration.caldav.buttonSave').click();

    cy.wait('@patchCalendar').then(({ request }) => {
      expect(request.url).to.match(/\/api\/v1\/calendar\/my-caldav-calendar$/);
      expect(request.body).to.deep.equal({ shared: true });
    });
    cy.get('.alert-info')
      .should('exist')
      .i18n('integration.caldav.calendarChoiceSuccess');
  });
});
