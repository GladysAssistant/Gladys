import { Text, MarkupText } from 'preact-i18n';
import { connect } from 'unistore/preact';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import GladysPlusUpsell from '../../../../components/gateway/GladysPlusUpsell';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';

const GoogleWelcomePage = ({ user }) => (
  <IntegrationSubPageLayout
    title={<Text id="integration.googleHome.title" />}
    tabs={
      <DeviceConfigurationLink
        user={user}
        configurationKey="integrations"
        documentKey="google-home"
        linkClass="hz-tab-link"
      >
        <i class="fe fe-book-open" />
        <span>
          <Text id="integration.googleHome.documentation" />
        </span>
      </DeviceConfigurationLink>
    }
  >
    <GladysPlusUpsell
      icon="fe-mic"
      utmCampaign="integration_google_home"
      titleKey="gladysPlusUpsell.googleHome.title"
      descriptionKey="gladysPlusUpsell.googleHome.description"
      featureKeys={[
        'gladysPlusUpsell.googleHome.feature1',
        'gladysPlusUpsell.googleHome.feature2',
        'gladysPlusUpsell.googleHome.feature3'
      ]}
    />
    <div class="card">
      <div class="card-header">
        <h1 class="card-title">
          <Text id="integration.googleHome.title" />
        </h1>
      </div>
      <div class="card-body">
        <MarkupText id="integration.googleHome.longDescription" />
      </div>
    </div>
  </IntegrationSubPageLayout>
);

export default connect('user', {})(GoogleWelcomePage);
