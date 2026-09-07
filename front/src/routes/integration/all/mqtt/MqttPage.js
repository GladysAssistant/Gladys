import { Fragment } from 'preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';

const MqttPage = ({ children, user }) => (
  <IntegrationSubPageLayout
    title={<Text id="integration.mqtt.title" />}
    tabs={
      <Fragment>
        <Link href="/dashboard/integration/device/mqtt" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-radio" />
          <span>
            <Text id="integration.mqtt.deviceTab" />
          </span>
        </Link>

        <Link href="/dashboard/integration/device/mqtt/discovery" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-search" />
          <span>
            <Text id="integration.mqtt.discoverTab" />
          </span>
        </Link>

        <Link href="/dashboard/integration/device/mqtt/debug" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-code" />
          <span>
            <Text id="integration.mqtt.debugTab" />
          </span>
        </Link>

        <Link href="/dashboard/integration/device/mqtt/setup" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-sliders" />
          <span>
            <Text id="integration.mqtt.setupTab" />
          </span>
        </Link>

        <DeviceConfigurationLink user={user} configurationKey="integrations" documentKey="mqtt" linkClass="hz-tab-link">
          <i class="fe fe-book-open" />
          <span>
            <Text id="integration.mqtt.documentation" />
          </span>
        </DeviceConfigurationLink>

        <DeviceConfigurationLink user={user} configurationKey="api" documentKey="mqtt-api" linkClass="hz-tab-link">
          <i class="fe fe-book-open" />
          <span>
            <Text id="integration.mqtt.apiDocumentation" />
          </span>
        </DeviceConfigurationLink>
      </Fragment>
    }
  >
    {children}
  </IntegrationSubPageLayout>
);

export default MqttPage;
