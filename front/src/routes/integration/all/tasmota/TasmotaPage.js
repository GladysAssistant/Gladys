import { Fragment } from 'preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';

const TasmotaPage = ({ children, user }) => (
  <IntegrationSubPageLayout
    title={<Text id="integration.tasmota.title" />}
    tabs={
      <Fragment>
        <Link href="/dashboard/integration/device/tasmota" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-link" />
          <span>
            <Text id="integration.tasmota.deviceTab" />
          </span>
        </Link>

        <Link href="/dashboard/integration/device/tasmota/mqtt" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-radio" />
          <span>
            <Text id="integration.tasmota.mqttDiscoverTab" />
          </span>
        </Link>

        <Link href="/dashboard/integration/device/tasmota/http" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-globe" />
          <span>
            <Text id="integration.tasmota.httpDiscoverTab" />
          </span>
        </Link>

        <DeviceConfigurationLink
          user={user}
          configurationKey="integrations"
          documentKey="tasmota"
          linkClass="hz-tab-link"
        >
          <i class="fe fe-book-open" />
          <span>
            <Text id="integration.tasmota.discover.documentation" />
          </span>
        </DeviceConfigurationLink>
      </Fragment>
    }
  >
    {children}
  </IntegrationSubPageLayout>
);

export default TasmotaPage;
