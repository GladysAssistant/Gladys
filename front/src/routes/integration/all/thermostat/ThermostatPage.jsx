import { Fragment } from 'preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';

const ThermostatPage = ({ children, user }) => (
  <IntegrationSubPageLayout
    title={<Text id="integration.thermostat.title" />}
    tabs={
      <Fragment>
        <Link href="/dashboard/integration/device/thermostat" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-thermometer" />
          <span>
            <Text id="integration.thermostat.deviceTab" />
          </span>
        </Link>

        <Link href="/dashboard/integration/device/thermostat/schedule" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-calendar" />
          <span>
            <Text id="integration.thermostat.scheduleTab" />
          </span>
        </Link>

        <DeviceConfigurationLink
          user={user}
          configurationKey="integrations"
          documentKey="thermostat"
          linkClass="hz-tab-link"
        >
          <i class="fe fe-book-open" />
          <span>
            <Text id="integration.thermostat.documentationTab" />
          </span>
        </DeviceConfigurationLink>
      </Fragment>
    }
  >
    {children}
  </IntegrationSubPageLayout>
);

export default ThermostatPage;
