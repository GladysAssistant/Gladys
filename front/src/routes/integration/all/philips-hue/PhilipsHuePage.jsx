import { Fragment } from 'preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import DeprecationWarning from '../../../../components/integration/DeprecationWarning';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';

const PhilipsHuePage = ({ children, user }) => (
  <IntegrationSubPageLayout
    title={<Text id="integration.philipsHue.title" />}
    tabs={
      <Fragment>
        <Link href="/dashboard/integration/device/philips-hue/device" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-radio" />
          <span>
            <Text id="integration.philipsHue.deviceTab" />
          </span>
        </Link>

        <Link href="/dashboard/integration/device/philips-hue/setup" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-sliders" />
          <span>
            <Text id="integration.philipsHue.setupTab" />
          </span>
        </Link>

        <DeviceConfigurationLink
          user={user}
          configurationKey="integrations"
          documentKey="philips-hue"
          linkClass="hz-tab-link"
        >
          <i class="fe fe-book-open" />
          <span>
            <Text id="integration.philipsHue.documentation" />
          </span>
        </DeviceConfigurationLink>
      </Fragment>
    }
  >
    <DeprecationWarning />
    {children}
  </IntegrationSubPageLayout>
);

export default PhilipsHuePage;
