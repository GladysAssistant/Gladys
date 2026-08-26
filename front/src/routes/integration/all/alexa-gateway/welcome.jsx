import { Text, MarkupText } from 'preact-i18n';
import { connect } from 'unistore/preact';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import GladysPlusUpsell from '../../../../components/gateway/GladysPlusUpsell';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';

const AlexaWelcomePage = ({ user }) => (
  <IntegrationSubPageLayout
    title={<Text id="integration.alexa.title" />}
    tabs={
      <DeviceConfigurationLink user={user} configurationKey="integrations" documentKey="alexa" linkClass="hz-tab-link">
        <i class="fe fe-book-open" />
        <span>
          <Text id="integration.alexa.documentation" />
        </span>
      </DeviceConfigurationLink>
    }
  >
    <GladysPlusUpsell
      icon="fe-mic"
      utmCampaign="integration_alexa"
      titleKey="gladysPlusUpsell.alexa.title"
      descriptionKey="gladysPlusUpsell.alexa.description"
      featureKeys={[
        'gladysPlusUpsell.alexa.feature1',
        'gladysPlusUpsell.alexa.feature2',
        'gladysPlusUpsell.alexa.feature3'
      ]}
    />
    <div class="card">
      <div class="card-body">
        <MarkupText id="integration.alexa.longDescription" />
      </div>
    </div>
  </IntegrationSubPageLayout>
);

export default connect('user', {})(AlexaWelcomePage);
