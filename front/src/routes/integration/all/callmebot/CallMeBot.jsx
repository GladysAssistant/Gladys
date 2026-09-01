import { Fragment } from 'preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';

const CallMeBotPage = ({ children, user }) => (
  <IntegrationSubPageLayout
    title={<Text id="integration.callmebot.title" />}
    tabs={
      <Fragment>
        <Link href="/dashboard/integration/communication/callmebot" activeClassName="active" class="hz-tab-link">
          <i class="fe fe-sliders" />
          <span>
            <Text id="integration.callmebot.setupTab" />
          </span>
        </Link>

        <DeviceConfigurationLink
          user={user}
          configurationKey="integrations"
          documentKey="callmebot"
          linkClass="hz-tab-link"
        >
          <i class="fe fe-book-open" />
          <span>
            <Text id="integration.callmebot.documentation" />
          </span>
        </DeviceConfigurationLink>
      </Fragment>
    }
  >
    {children}
  </IntegrationSubPageLayout>
);

export default CallMeBotPage;
