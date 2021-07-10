import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import actions from '../../actions/oauth/authorize';

const DeniedClientPage = connect(
  'oauthClient',
  actions
)(({ oauthClient }) => (
  <div class="card">
    <div class="card-body p-6">
      <div class="card-title">
        <Text id="authorize.denyClientTitle" fields={{ client: oauthClient.name }} />
      </div>
    </div>
  </div>
));

export default DeniedClientPage;
