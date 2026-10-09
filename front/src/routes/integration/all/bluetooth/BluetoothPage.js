import { Fragment } from 'preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';

const BluetoothPage = ({ children, user }) => (
  <IntegrationSubPageLayout
    title={<Text id="integration.bluetooth.title" />}
    tabs={
      <Fragment>
        <Link href="/dashboard/integration/device/bluetooth" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-link" />
          <span>
            <Text id="integration.bluetooth.deviceTab" />
          </span>
        </Link>

        <Link href="/dashboard/integration/device/bluetooth/setup" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-radio" />
          <span>
            <Text id="integration.bluetooth.discoverTab" />
          </span>
        </Link>

        <Link href="/dashboard/integration/device/bluetooth/config" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-settings" />
          <span>
            <Text id="integration.bluetooth.setupTab" />
          </span>
        </Link>

        <DeviceConfigurationLink
          user={user}
          configurationKey="integrations"
          documentKey="bluetooth"
          linkClass="hz-tab-link"
        >
          <i class="fe fe-book-open" />
          <span>
            <Text id="integration.bluetooth.documentation" />
          </span>
        </DeviceConfigurationLink>
      </Fragment>
    }
  >
    {children}
  </IntegrationSubPageLayout>
);

export default BluetoothPage;
