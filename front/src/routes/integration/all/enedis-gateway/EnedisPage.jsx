import { Fragment } from 'preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';

const EnedisPage = ({ children, user }) => (
  <IntegrationSubPageLayout
    title={<Text id="integration.enedis.title" />}
    tabs={
      <Fragment>
        <Link href="/dashboard/integration/device/enedis" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-home" />
          <span>
            <Text id="integration.enedis.welcomeTab" />
          </span>
        </Link>

        <Link href="/dashboard/integration/device/enedis/usage-points" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-zap" />
          <span>
            <Text id="integration.enedis.usagePointsTab" />
          </span>
        </Link>

        <DeviceConfigurationLink
          user={user}
          configurationKey="integrations"
          documentKey="enedis"
          linkClass="hz-tab-link"
        >
          <i class="fe fe-book-open" />
          <span>
            <Text id="integration.enedis.documentation" />
          </span>
        </DeviceConfigurationLink>
      </Fragment>
    }
  >
    {children}
  </IntegrationSubPageLayout>
);

export default EnedisPage;
