import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import EnedisButton from './enedis-button.png';
import { route } from 'preact-router';

const EnedisWelcomePage = ({ redirectUri, errored, loading }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="row">
            <div class="col-lg-12">
              <div class="card">
                <div class="card-header">
                  <h3 class="card-title">
                    <Text id="integration.enedis.title" />
                  </h3>
                </div>
                <div class="card-body">
                  <div
                    class={cx('dimmer', {
                      active: loading
                    })}
                  >
                    <div class="loader" />
                    <div class="dimmer-content">
                      {errored && (
                        <p class="alert alert-danger">
                          <Text id="integration.enedis.error" />
                        </p>
                      )}
                      <p>
                        <Text id="integration.enedis.longDescription" />
                      </p>
                      <p>
                        <Text id="integration.enedis.buttonDescription" />
                      </p>
                      <a href={redirectUri} target="_blank" rel="noreferrer noopener">
                        <Localizer>
                          <img src={EnedisButton} alt={<Text id="integration.enedis.buttonDescription" />} />
                        </Localizer>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

class EnedisWelcomePageComponent extends Component {
  getRedirectUri = async () => {
    const response = await this.props.session.gatewayClient.initializeEnedis();
    this.setState({
      redirectUri: response.redirect_uri
    });
  };
  detectCode = async () => {
    if (this.props.code) {
      try {
        await this.setState({ loading: true, errored: false });
        const response = await this.props.session.gatewayClient.finalizeEnedis(this.props.code);
        this.setState({
          loading: false,
          usagePointsIds: response.usage_points_id
        });
        await this.props.httpClient.post('/api/v1/service/zigbee2mqtt/variable/ENEDIS_USAGE_POINTS_ID', {
          value: JSON.stringify(response.usage_points_id)
        });
        route('/dashboard/integration/device/enedis');
      } catch (e) {
        await this.setState({ loading: false, errored: true });
      }
    }
  };
  componentDidMount() {
    this.getRedirectUri();
    this.detectCode();
  }
  render({}, { redirectUri, loading, errored }) {
    return <EnedisWelcomePage redirectUri={redirectUri} loading={loading} errored={errored} />;
  }
}

export default connect('user,session,httpClient', {})(EnedisWelcomePageComponent);
