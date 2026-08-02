import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';

// Generic OAuth2 callback route: the provider redirects the popup here with
// code + state; the page relays them to the Gladys server (which forwards
// them to the integration over WebSocket) then invites the user to close
// the window. The oauth2 field key is recovered through localStorage,
// written by the Configuration page before opening the popup (the popup is
// a new tab: sessionStorage would not be shared).
class ExternalIntegrationOAuthCallbackPage extends Component {
  relayCallback = async () => {
    const { selector } = this.props;
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const key = localStorage.getItem(`externalIntegrationOAuthKey:${selector}`);
    if (!code || !state || !key) {
      this.setState({ relayStatus: RequestStatus.Error, missingParams: true });
      return;
    }
    this.setState({ relayStatus: RequestStatus.Getting });
    try {
      await this.props.httpClient.post(`/api/v1/external_integration/${selector}/oauth/callback`, {
        key,
        code,
        state,
        redirect_uri: `${window.location.origin}/dashboard/integration/device/external/${selector}/oauth-callback`
      });
      localStorage.removeItem(`externalIntegrationOAuthKey:${selector}`);
      this.setState({ relayStatus: RequestStatus.Success });
    } catch (e) {
      console.error(e);
      this.setState({ relayStatus: RequestStatus.Error, missingParams: false });
    }
  };

  componentWillMount() {
    this.relayCallback();
  }

  render({ selector }, { relayStatus, missingParams }) {
    return (
      <div class="container mt-6">
        <div class="row justify-content-center">
          <div class="col-lg-6">
            <div class="card">
              <div class="card-header">
                <h3 class="card-title">
                  <Text id="integration.externalIntegration.oauthCallback.title" />
                </h3>
              </div>
              <div
                class={cx('dimmer', {
                  active: relayStatus === RequestStatus.Getting
                })}
              >
                <div class="loader" />
                <div class="dimmer-content">
                  <div class="card-body">
                    {relayStatus === RequestStatus.Getting && (
                      <p>
                        <Text id="integration.externalIntegration.oauthCallback.relayingText" />
                      </p>
                    )}
                    {relayStatus === RequestStatus.Success && (
                      <div class="alert alert-success">
                        <Text id="integration.externalIntegration.oauthCallback.successText" />
                      </div>
                    )}
                    {relayStatus === RequestStatus.Error && (
                      <div class="alert alert-danger">
                        {missingParams ? (
                          <Text id="integration.externalIntegration.oauthCallback.missingParamsText" />
                        ) : (
                          <Text id="integration.externalIntegration.oauthCallback.errorText" />
                        )}
                      </div>
                    )}
                    {relayStatus !== RequestStatus.Getting && (
                      <p class="text-muted">
                        <Text id="integration.externalIntegration.oauthCallback.closeText" />
                      </p>
                    )}
                    <Link href={`/dashboard/integration/device/external/${selector}/config`} class="btn btn-secondary">
                      <Text id="integration.externalIntegration.oauthCallback.backToConfigButton" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient')(ExternalIntegrationOAuthCallbackPage);
