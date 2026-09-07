import { Fragment } from 'preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import DeprecationWarning from '../../../../components/integration/DeprecationWarning';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';

const NetatmoPage = props => (
  <IntegrationSubPageLayout
    title={<Text id="integration.netatmo.title" />}
    tabs={
      <Fragment>
        <Link href="/dashboard/integration/device/netatmo" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-link" />
          <span>
            <Text id="integration.netatmo.deviceTab" />
          </span>
        </Link>

        <Link href="/dashboard/integration/device/netatmo/discover" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-radio" />
          <span>
            <Text id="integration.netatmo.discoverTab" />
          </span>
        </Link>

        <Link href="/dashboard/integration/device/netatmo/setup" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-sliders" />
          <span>
            <Text id="integration.netatmo.setupTab" />
          </span>
        </Link>

        <DeviceConfigurationLink
          user={props.user}
          configurationKey="integrations"
          documentKey="netatmo"
          linkClass="hz-tab-link"
        >
          <i class="fe fe-book-open" />
          <span>
            <Text id="integration.netatmo.documentation" />
          </span>
        </DeviceConfigurationLink>
      </Fragment>
    }
  >
    <DeprecationWarning />
    {props.children}
  </IntegrationSubPageLayout>
);

export default NetatmoPage;
