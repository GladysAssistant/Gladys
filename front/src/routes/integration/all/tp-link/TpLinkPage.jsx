import { Fragment } from 'preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import DeprecationWarning from '../../../../components/integration/DeprecationWarning';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';

const TpLinkPage = ({ children, user }) => (
  <IntegrationSubPageLayout
    title={<Text id="integration.tpLink.title" />}
    tabs={
      <Fragment>
        <Link href="/dashboard/integration/device/tp-link/device" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-radio" />
          <span>
            <Text id="integration.tpLink.deviceTab" />
          </span>
        </Link>

        <DeviceConfigurationLink
          user={user}
          configurationKey="integrations"
          documentKey="tp-link"
          linkClass="hz-tab-link"
        >
          <i class="fe fe-book-open" />
          <span>
            <Text id="integration.tpLink.documentation" />
          </span>
        </DeviceConfigurationLink>
      </Fragment>
    }
  >
    <DeprecationWarning />
    {children}
  </IntegrationSubPageLayout>
);

export default TpLinkPage;
