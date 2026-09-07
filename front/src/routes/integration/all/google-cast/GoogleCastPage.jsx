import { Fragment } from 'preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';

const GoogleCastPage = ({ children, user }) => (
  <IntegrationSubPageLayout
    title={<Text id="integration.google-cast.title" />}
    tabs={
      <Fragment>
        <Link href="/dashboard/integration/device/google-cast" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-link" />
          <span>
            <Text id="integration.google-cast.deviceTab" />
          </span>
        </Link>

        <Link href="/dashboard/integration/device/google-cast/discover" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-radio" />
          <span>
            <Text id="integration.google-cast.discoverTab" />
          </span>
        </Link>

        <DeviceConfigurationLink
          user={user}
          configurationKey="integrations"
          documentKey="googleCast"
          linkClass="hz-tab-link"
        >
          <i class="fe fe-book-open" />
          <span>
            <Text id="integration.google-cast.documentation" />
          </span>
        </DeviceConfigurationLink>
      </Fragment>
    }
  >
    {children}
  </IntegrationSubPageLayout>
);

export default GoogleCastPage;
