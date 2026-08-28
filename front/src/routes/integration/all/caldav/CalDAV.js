import { Fragment } from 'preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';

const CalDAV = ({ children, user }) => (
  <IntegrationSubPageLayout
    title={<Text id="integration.caldav.title" />}
    tabs={
      <Fragment>
        <Link href="/dashboard/integration/calendar/caldav/account" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-radio" />
          <span>
            <Text id="integration.caldav.accountTab" />
          </span>
        </Link>

        <Link href="/dashboard/integration/calendar/caldav/sync" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-refresh-cw" />
          <span>
            <Text id="integration.caldav.syncTab" />
          </span>
        </Link>

        <Link href="/dashboard/integration/calendar/caldav/share" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-share" />
          <span>
            <Text id="integration.caldav.shareTab" />
          </span>
        </Link>

        <DeviceConfigurationLink
          user={user}
          configurationKey="integrations"
          documentKey="caldav"
          linkClass="hz-tab-link"
        >
          <i class="fe fe-book-open" />
          <span>
            <Text id="integration.caldav.documentation" />
          </span>
        </DeviceConfigurationLink>
      </Fragment>
    }
  >
    {children}
  </IntegrationSubPageLayout>
);

export default CalDAV;
