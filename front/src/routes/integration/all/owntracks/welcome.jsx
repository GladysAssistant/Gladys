import { Text, MarkupText } from 'preact-i18n';
import { connect } from 'unistore/preact';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import IntegrationSubPageLayout from '../../../../components/integration/IntegrationSubPageLayout';

const OwntracksWelcomePage = ({ user }) => (
  <IntegrationSubPageLayout
    title={<Text id="integration.owntracks.title" />}
    tabs={
      <DeviceConfigurationLink
        user={user}
        configurationKey="integrations"
        documentKey="owntracks"
        linkClass="hz-tab-link"
      >
        <i class="fe fe-book-open" />
        <span>
          <Text id="integration.owntracks.documentation" />
        </span>
      </DeviceConfigurationLink>
    }
  >
    <div class="card">
      <div class="card-body">
        <MarkupText id="integration.owntracks.longDescription" />
      </div>
    </div>
  </IntegrationSubPageLayout>
);

export default connect('user', {})(OwntracksWelcomePage);
