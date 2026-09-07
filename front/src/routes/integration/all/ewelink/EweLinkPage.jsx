import { Fragment } from 'preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';

const EweLinkPage = ({ children, user }) => (
  <IntegrationSubPageLayout
    title={<Text id="integration.eWeLink.title" />}
    tabs={
      <Fragment>
        <Link href="/dashboard/integration/device/ewelink" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-link" />
          <span>
            <Text id="integration.eWeLink.deviceTab" />
          </span>
        </Link>

        <Link href="/dashboard/integration/device/ewelink/discover" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-radio" />
          <span>
            <Text id="integration.eWeLink.discoverTab" />
          </span>
        </Link>

        <Link href="/dashboard/integration/device/ewelink/setup" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-sliders" />
          <span>
            <Text id="integration.eWeLink.setupTab" />
          </span>
        </Link>

        <DeviceConfigurationLink
          user={user}
          configurationKey="integrations"
          documentKey="sonoff"
          linkClass="hz-tab-link"
        >
          <i class="fe fe-book-open" />
          <span>
            <Text id="integration.eWeLink.documentation" />
          </span>
        </DeviceConfigurationLink>
      </Fragment>
    }
  >
    {children}
  </IntegrationSubPageLayout>
);

export default EweLinkPage;
