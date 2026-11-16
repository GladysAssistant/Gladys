import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import { USER_ROLE } from '../../../../server/utils/constants';

// the catalog search finds the calendar integrations of the store by their
// name and descriptions (every language is searched, so the English word
// matches whatever the user's language)
const CALENDAR_CATALOG_URL = '/dashboard/integration?search=calendar';

const getIntegrationConfigUrl = integration => `/dashboard/integration/device/external/${integration.selector}/config`;

/**
 * Shown above the calendar while the user sees no calendar at all: calendars
 * only come from calendar integrations, each user enabling their own account
 * on them ("My calendars" block), or from a calendar another member shares.
 * The notice says so and links to the next step: the installed calendar
 * integrations to enable, else the catalog (admins) or an admin (users).
 */
const NoCalendarConnected = ({ user, calendarIntegrations }) => {
  const isAdmin = user && user.role === USER_ROLE.ADMIN;
  const installed = calendarIntegrations || [];
  let explanationKey = 'calendar.noCalendarsConnected.askAdmin';
  if (installed.length > 0) {
    explanationKey = 'calendar.noCalendarsConnected.enableInstalled';
  } else if (isAdmin) {
    explanationKey = 'calendar.noCalendarsConnected.installIntegration';
  }
  return (
    <div class="alert alert-info alert-icon" data-cy="calendar-no-calendar-connected">
      <i class="fe fe-calendar mr-2" aria-hidden="true" />
      <div class="font-weight-bold mb-1">
        <Text id="calendar.noCalendarsConnected.title" />
      </div>
      <div>
        <Text id={explanationKey} />
      </div>
      {installed.length > 0 && (
        <ul class="mb-0 mt-1 pl-4">
          {installed.map(integration => (
            <li key={integration.selector}>
              <Link href={getIntegrationConfigUrl(integration)} data-cy="calendar-integration-link">
                {integration.manifest.name || integration.name || integration.selector}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {isAdmin && (
        <div class="mt-2">
          <Link href={CALENDAR_CATALOG_URL} data-cy="calendar-catalog-link">
            <Text id="calendar.noCalendarsConnected.browseCatalog" />
          </Link>
        </div>
      )}
      <div class="mt-2">
        <Text id="calendar.noCalendarsConnected.sharedCalendars" />
      </div>
    </div>
  );
};

export default NoCalendarConnected;
