import { Fragment } from 'preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';

const Zigbee2mqttPage = ({ children, user }) => (
  <IntegrationSubPageLayout
    title={<Text id="integration.zigbee2mqtt.title" />}
    tabs={
      <Fragment>
        <Link href="/dashboard/integration/device/zigbee2mqtt" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-link" />
          <span>
            <Text id="integration.zigbee2mqtt.deviceTab" />
          </span>
        </Link>

        <Link href="/dashboard/integration/device/zigbee2mqtt/discover" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-radio" />
          <span>
            <Text id="integration.zigbee2mqtt.discoverTab" />
          </span>
        </Link>

        <Link href="/dashboard/integration/device/zigbee2mqtt/setup" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-sliders" />
          <span>
            <Text id="integration.zigbee2mqtt.setupTab" />
          </span>
        </Link>

        <DeviceConfigurationLink
          user={user}
          configurationKey="integrations"
          documentKey="zigbee2mqtt"
          linkClass="hz-tab-link"
        >
          <i class="fe fe-book-open" />
          <span>
            <Text id="integration.zigbee2mqtt.documentation" />
          </span>
        </DeviceConfigurationLink>
      </Fragment>
    }
  >
    {children}
  </IntegrationSubPageLayout>
);

export default Zigbee2mqttPage;
