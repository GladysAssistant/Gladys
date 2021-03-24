import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../utils/consts';

@connect('httpClient')
class ClientIdSecretForm extends Component {
  loadOauthData = async () => {
    this.setState({ status: RequestStatus.Getting });

    try {
      const oauthData = await this.props.httpClient.get(`/api/v1/oauth/client/${this.props.clientId}`);
      this.setState({ status: RequestStatus.Success, clientActive: oauthData.active, clientSecret: oauthData.secret });
    } catch (e) {
      this.setState({ status: RequestStatus.ServiceNotConfigured, clientSecret: undefined });
    }
  };

  toggleStatus = async () => {
    this.setState({ status: RequestStatus.Getting });

    try {
      const oauthData = await this.props.httpClient.post(`/api/v1/oauth/client/${this.props.clientId}`, {
        active: !this.state.clientActive
      });
      this.setState({ status: RequestStatus.Success, clientActive: oauthData.active });
    } catch (e) {
      this.setState({ status: RequestStatus.Error });
    }
  };

  async componentDidMount() {
    await this.loadOauthData();
  }

  render({ clientId, children, title }, { clientActive, clientSecret, status }) {
    return (
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">{title}</h3>
          <div class="page-options d-flex">
            <label class="custom-switch">
              <input type="checkbox" checked={clientActive} onClick={this.toggleStatus} class="custom-switch-input" />
              <span class="custom-switch-indicator" />
            </label>
          </div>
        </div>
        <div class="card-body">
          <div
            class={cx('dimmer', {
              active: !status || status === RequestStatus.Getting
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              {status === RequestStatus.ServiceNotConfigured && (
                <p class="alert alert-danger">
                  <Text id="authorize.card.loadError" fields={{ client: clientId }} />
                </p>
              )}
              {status === RequestStatus.Error && (
                <p class="alert alert-danger">
                  <Text id="authorize.card.changeStatusError" fields={{ client: clientId }} />
                </p>
              )}
              <div class="form-group">
                <label class="form-label">
                  <Text id="authorize.card.clientIdLabel" />
                </label>
                <Localizer>
                  <input
                    placeholder={<Text id="authorize.card.clientIdLabel" />}
                    value={clientId}
                    class="form-control"
                    disabled
                  />
                </Localizer>
              </div>

              <div class="form-group">
                <label class="form-label">
                  <Text id="authorize.card.clientSecretLabel" />
                </label>
                <Localizer>
                  <input
                    placeholder={<Text id="authorize.card.clientSecretLabel" />}
                    value={clientSecret}
                    class="form-control"
                    disabled
                  />
                </Localizer>
              </div>
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ClientIdSecretForm;
