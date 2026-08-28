import { Fragment } from 'preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import DeprecationWarning from '../../../../components/integration/DeprecationWarning';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';

const MELCloudPage = ({ children, user }) => (
  <IntegrationSubPageLayout
    title={<Text id="integration.melcloud.title" />}
    tabs={
      <Fragment>
        <Link href="/dashboard/integration/device/melcloud" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-link" />
          <span>
            <Text id="integration.melcloud.deviceTab" />
          </span>
        </Link>

        <Link href="/dashboard/integration/device/melcloud/discover" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-radio" />
          <span>
            <Text id="integration.melcloud.discoverTab" />
          </span>
        </Link>

        <Link href="/dashboard/integration/device/melcloud/setup" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-sliders" />
          <span>
            <Text id="integration.melcloud.setupTab" />
          </span>
        </Link>

        <DeviceConfigurationLink
          user={user}
          configurationKey="integrations"
          documentKey="melcloud"
          linkClass="hz-tab-link"
        >
          <i class="fe fe-book-open" />
          <span>
            <Text id="integration.melcloud.documentation" />
          </span>
        </DeviceConfigurationLink>
      </Fragment>
    }
  >
    <DeprecationWarning />
    {children}
  </IntegrationSubPageLayout>
);

export default MELCloudPage;
