import { Fragment } from 'preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';

const ZwaveJSUIPage = ({ children, user }) => (
  <IntegrationSubPageLayout
    title={<Text id="integration.zwavejs-ui.title" />}
    tabs={
      <Fragment>
        <Link href="/dashboard/integration/device/zwavejs-ui" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-link" />
          <span>
            <Text id="integration.zwavejs-ui.deviceTab" />
          </span>
        </Link>

        <Link href="/dashboard/integration/device/zwavejs-ui/discover" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-radio" />
          <span>
            <Text id="integration.zwavejs-ui.discoverTab" />
          </span>
        </Link>

        <Link href="/dashboard/integration/device/zwavejs-ui/setup" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-sliders" />
          <span>
            <Text id="integration.zwavejs-ui.setupTab" />
          </span>
        </Link>

        <DeviceConfigurationLink
          user={user}
          documentKey="zwavejs-ui"
          configurationKey="integrations"
          linkClass="hz-tab-link"
        >
          <i class="fe fe-book-open" />
          <span>
            <Text id="integration.zwavejs-ui.documentation" />
          </span>
        </DeviceConfigurationLink>
      </Fragment>
    }
  >
    {children}
  </IntegrationSubPageLayout>
);

export default ZwaveJSUIPage;
