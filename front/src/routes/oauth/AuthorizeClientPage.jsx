import { Text } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../utils/consts';

const AuthorizeClientPage = ({ oauthClient, denyAuthorize, allowAuthorize, oauthorizeStatus, oauthorizeError }) => (
  <form class="card">
    <div class="card-body p-6">
      <div class="card-title">
        <Text id="authorize.authorizeTitle" fields={{ client: oauthClient.name }} />
      </div>

      {oauthorizeError && (
        <div class="alert alert-danger">
          {oauthorizeError}
          <Text id={`authorize.error.${oauthorizeError.error}`} />
        </div>
      )}

      {!oauthClient.active && (
        <div class="alert alert-danger">
          <Text id={`authorize.error.client_disabled`} />
        </div>
      )}

      <ul class="list-group">
        <li class="list-group-item">
          <Text id="authorize.grants.user" />
        </li>
      </ul>

      <div
        class={cx('dimmer', {
          active: oauthorizeStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          <div class="form-footer row">
            <div class="col-sm-6">
              <button
                type="button"
                class="btn btn-secondary btn-block"
                onClick={denyAuthorize}
                disabled={!oauthClient.active}
              >
                <Text id="authorize.denyButtonText" />
              </button>
            </div>
            <div class="col-sm-6">
              <button
                type="button"
                class="btn btn-primary btn-block"
                onClick={allowAuthorize}
                disabled={!oauthClient.active}
              >
                <Text id="authorize.allowButtonText" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </form>
);

export default AuthorizeClientPage;
