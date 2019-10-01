import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import actions from '../../actions/oauth/authorize';

const AuthorizeClientPage = connect(
  'oauthClient,redirectUri,oauthState',
  actions
)(({ oauthClient, denyAuthorize, allowAuthorize }) => (
  <form class="card">
    <div class="card-body p-6">
      <div class="card-title">
        <Text id="authorize.authorizeTitle" fields={{ client: oauthClient.name }} />
      </div>

      <ul class="list-group">
        <li class="list-group-item">
          <Text id="authorize.grants.user" />
        </li>
      </ul>

      <div class="form-footer row">
        <div class="col-sm-6">
          <button type="button" class="btn btn-secondary btn-block" onClick={denyAuthorize}>
            <Text id="authorize.denyButtonText" />
          </button>
        </div>
        <div class="col-sm-6">
          <button type="button" class="btn btn-primary btn-block" onClick={allowAuthorize}>
            <Text id="authorize.allowButtonText" />
          </button>
        </div>
      </div>
    </div>
  </form>
));

export default AuthorizeClientPage;
