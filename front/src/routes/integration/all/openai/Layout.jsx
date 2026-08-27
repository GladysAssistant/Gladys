import { Text } from 'preact-i18n';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';

const Layout = ({ children, user }) => (
  <IntegrationSubPageLayout
    title={<Text id="integration.openai.title" />}
    tabs={
      <DeviceConfigurationLink user={user} configurationKey="integrations" documentKey="openai" linkClass="hz-tab-link">
        <i class="fe fe-book-open" />
        <span>
          <Text id="integration.openai.documentation" />
        </span>
      </DeviceConfigurationLink>
    }
  >
    {children}
  </IntegrationSubPageLayout>
);

export default Layout;
