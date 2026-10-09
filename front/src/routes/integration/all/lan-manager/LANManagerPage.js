import { Fragment } from 'preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';

const LANManagerPage = ({ children, user }) => (
  <IntegrationSubPageLayout
    title={<Text id="integration.lanManager.title" />}
    tabs={
      <Fragment>
        <Link href="/dashboard/integration/device/lan-manager" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-link" />
          <span>
            <Text id="integration.lanManager.deviceTab" />
          </span>
        </Link>

        <Link href="/dashboard/integration/device/lan-manager/discover" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-radio" />
          <span>
            <Text id="integration.lanManager.discoverTab" />
          </span>
        </Link>

        <Link href="/dashboard/integration/device/lan-manager/config" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-settings" />
          <span>
            <Text id="integration.lanManager.setupTab" />
          </span>
        </Link>

        <DeviceConfigurationLink
          user={user}
          configurationKey="integrations"
          documentKey="lan-manager"
          linkClass="hz-tab-link"
        >
          <i class="fe fe-book-open" />
          <span>
            <Text id="integration.lanManager.documentation" />
          </span>
        </DeviceConfigurationLink>
      </Fragment>
    }
  >
    {children}
  </IntegrationSubPageLayout>
);

export default LANManagerPage;
