import { Fragment } from 'preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';

const BroadlinkPage = ({ children, user }) => (
  <IntegrationSubPageLayout
    title={<Text id="integration.broadlink.title" />}
    tabs={
      <Fragment>
        <Link href="/dashboard/integration/device/broadlink" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-radio" />
          <span>
            <Text id="integration.broadlink.remoteTab" />
          </span>
        </Link>

        <Link href="/dashboard/integration/device/broadlink/peripheral" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-wifi" />
          <span>
            <Text id="integration.broadlink.peripheralTab" />
          </span>
        </Link>

        <DeviceConfigurationLink
          user={user}
          configurationKey="integrations"
          documentKey="broadlink"
          linkClass="hz-tab-link"
        >
          <i class="fe fe-book-open" />
          <span>
            <Text id="integration.broadlink.documentation" />
          </span>
        </DeviceConfigurationLink>
      </Fragment>
    }
  >
    {children}
  </IntegrationSubPageLayout>
);

export default BroadlinkPage;
