import { Fragment } from 'preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';

const SonosPage = ({ children, user }) => (
  <IntegrationSubPageLayout
    title={<Text id="integration.sonos.title" />}
    tabs={
      <Fragment>
        <Link href="/dashboard/integration/device/sonos" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-link" />
          <span>
            <Text id="integration.sonos.deviceTab" />
          </span>
        </Link>

        <Link href="/dashboard/integration/device/sonos/discover" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-radio" />
          <span>
            <Text id="integration.sonos.discoverTab" />
          </span>
        </Link>

        <DeviceConfigurationLink
          user={user}
          configurationKey="integrations"
          documentKey="sonos"
          linkClass="hz-tab-link"
        >
          <i class="fe fe-book-open" />
          <span>
            <Text id="integration.sonos.documentation" />
          </span>
        </DeviceConfigurationLink>
      </Fragment>
    }
  >
    {children}
  </IntegrationSubPageLayout>
);

export default SonosPage;
