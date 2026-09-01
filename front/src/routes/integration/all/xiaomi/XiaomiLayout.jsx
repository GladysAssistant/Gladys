import { Fragment } from 'preact';
import { Text, MarkupText } from 'preact-i18n';
import { Link } from 'preact-router/match';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';

const XiaomiLayout = ({ children, user }) => (
  <IntegrationSubPageLayout
    title={<Text id="integration.xiaomi.title" />}
    tabs={
      <Fragment>
        <Link href="/dashboard/integration/device/xiaomi" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-radio" />
          <span>
            <Text id="integration.xiaomi.deviceTab" />
          </span>
        </Link>

        <DeviceConfigurationLink
          user={user}
          configurationKey="integrations"
          documentKey="xiaomi"
          linkClass="hz-tab-link"
        >
          <i class="fe fe-book-open" />
          <span>
            <Text id="integration.xiaomi.documentation" />
          </span>
        </DeviceConfigurationLink>
      </Fragment>
    }
  >
    <div class="alert alert-warning mb-4">
      <h4 class="alert-title">
        <Text id="integration.xiaomi.deprecatedWarning.title" />
      </h4>
      <MarkupText id="integration.xiaomi.deprecatedWarning.description" />
    </div>
    {children}
  </IntegrationSubPageLayout>
);

export default XiaomiLayout;
