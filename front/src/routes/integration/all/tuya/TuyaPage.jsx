import { Fragment } from 'preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import DeprecationWarning from '../../../../components/integration/DeprecationWarning';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';

const TuyaPage = ({ children, user }) => (
  <IntegrationSubPageLayout
    title={<Text id="integration.tuya.title" />}
    tabs={
      <Fragment>
        <Link href="/dashboard/integration/device/tuya" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-link" />
          <span>
            <Text id="integration.tuya.deviceTab" />
          </span>
        </Link>

        <Link href="/dashboard/integration/device/tuya/discover" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-radio" />
          <span>
            <Text id="integration.tuya.discoverTab" />
          </span>
        </Link>

        <Link href="/dashboard/integration/device/tuya/setup" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-sliders" />
          <span>
            <Text id="integration.tuya.setupTab" />
          </span>
        </Link>

        <DeviceConfigurationLink user={user} configurationKey="integrations" documentKey="tuya" linkClass="hz-tab-link">
          <i class="fe fe-book-open" />
          <span>
            <Text id="integration.tuya.documentation" />
          </span>
        </DeviceConfigurationLink>
      </Fragment>
    }
  >
    <DeprecationWarning />
    {children}
  </IntegrationSubPageLayout>
);

export default TuyaPage;
