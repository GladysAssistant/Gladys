import { Fragment } from 'preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';

const MatterPage = ({ children, user }) => (
  <IntegrationSubPageLayout
    title={<Text id="integration.matter.title" />}
    tabs={
      <Fragment>
        <Link href="/dashboard/integration/device/matter" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-cpu" />
          <span>
            <Text id="integration.matter.deviceTab" />
          </span>
        </Link>

        <Link href="/dashboard/integration/device/matter/discover" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-plus-circle" />
          <span>
            <Text id="integration.matter.addTab" />
          </span>
        </Link>

        <Link href="/dashboard/integration/device/matter/settings" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-settings" />
          <span>
            <Text id="integration.matter.settingsTab" />
          </span>
        </Link>

        <DeviceConfigurationLink
          user={user}
          documentKey="matter"
          configurationKey="integrations"
          linkClass="hz-tab-link"
        >
          <i class="fe fe-book-open" />
          <span>
            <Text id="integration.matter.documentation" />
          </span>
        </DeviceConfigurationLink>
      </Fragment>
    }
  >
    {children}
  </IntegrationSubPageLayout>
);

export default MatterPage;
