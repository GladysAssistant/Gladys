import { Fragment } from 'preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';

const NukiPage = ({ children, user }) => (
  <IntegrationSubPageLayout
    title={<Text id="integration.nuki.title" />}
    tabs={
      <Fragment>
        <Link href="/dashboard/integration/device/nuki" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-link" />
          <span>
            <Text id="integration.nuki.deviceTab" />
          </span>
        </Link>

        <Link href="/dashboard/integration/device/nuki/mqtt" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-radio" />
          <span>
            <Text id="integration.nuki.mqttDiscoverTab" />
          </span>
        </Link>

        <Link href="/dashboard/integration/device/nuki/http" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-globe" />
          <span>
            <Text id="integration.nuki.httpDiscoverTab" />
          </span>
        </Link>

        <Link href="/dashboard/integration/device/nuki/setup" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-sliders" />
          <span>
            <Text id="integration.nuki.setupTab" />
          </span>
        </Link>

        <DeviceConfigurationLink user={user} configurationKey="integrations" documentKey="nuki" linkClass="hz-tab-link">
          <i class="fe fe-book-open" />
          <span>
            <Text id="integration.nuki.documentation" />
          </span>
        </DeviceConfigurationLink>
      </Fragment>
    }
  >
    {children}
  </IntegrationSubPageLayout>
);

export default NukiPage;
