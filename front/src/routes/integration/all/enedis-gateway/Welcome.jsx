import { Component } from 'preact';
import { connect } from 'unistore/preact';
import Promise from 'bluebird';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import EnedisButton from './enedis-button.png';
import withIntlAsProp from '../../../../utils/withIntlAsProp';
import { route } from 'preact-router';
import config from '../../../../config';

import EnedisPage from './EnedisPage';
import { buildUsagePointDevicePayload } from './usagePointDeviceBuilder';

const EnedisWelcomePage = ({ redirectUri, errored, loading, usagePointsIds, notOnGladysGateway }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.enedis.welcome.title" />
      </h1>
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
              <Text id="integration.enedis.welcome.error" />
            </p>
          )}
          {notOnGladysGateway && (
            <p class="alert alert-info">
              <Text id="integration.enedis.welcome.notOnGladysGateway" />{' '}
              <a target="_blank" rel="noopener noreferrer" href="https://plus.gladysassistant.com">
                plus.gladysassistant.com
              </a>
            </p>
          )}
          {usagePointsIds && (
            <p class="alert alert-success">
              <Text id="integration.enedis.welcome.connectedToUsagePointds" />
              <br />
              <br />
              <Text id="integration.enedis.welcome.reconnectInfo" />
            </p>
          )}
          <p>
            <Text id="integration.enedis.welcome.longDescription" />
          </p>
          <p>
            <Text id="integration.enedis.welcome.longDescription2" />
          </p>
          <p>
            <Text id="integration.enedis.welcome.longDescription3" />
          </p>
          {!notOnGladysGateway && (
            <div>
              <p>
                <Text id="integration.enedis.welcome.buttonDescription" />
              </p>
              <a href={redirectUri} target="_blank" rel="noreferrer noopener">
                <Localizer>
                  <img src={EnedisButton} alt={<Text id="integration.enedis.welcome.buttonDescription" />} />
                </Localizer>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

class EnedisWelcomePageComponent extends Component {
  getRedirectUri = async () => {
    try {
      if (!this.props.session.gatewayClient) {
        this.setState({
          notOnGladysGateway: true
        });
        return;
      }
      const response = await this.props.session.gatewayClient.initializeEnedis();
      this.setState({
        redirectUri: response.redirect_uri
      });
    } catch (e) {
      console.error(e);
    }
  };
  getCurrentEnedisUsagePoints = async () => {
    try {
      const usagePointsDevices = await this.props.httpClient.get('/api/v1/service/enedis/device');
      return usagePointsDevices;
    } catch (e) {
      console.error(e);
      return [];
    }
  };
  createUsagePointDevice = async (usagePointId, serviceId) => {
    // Get current enedis devices
    const existingDevices = await this.getCurrentEnedisUsagePoints();
    // Check if device already exists
    const existingDevice = existingDevices.find(device => device.external_id.split(':')[1] === usagePointId);
    const device = buildUsagePointDevicePayload({
      usagePointId,
      serviceId,
      intlDictionary: this.props.intl.dictionary,
      existingDevice
    });
    await this.props.httpClient.post('/api/v1/device', device);
  };
  sync = async () => {
    await this.props.httpClient.post('/api/v1/service/enedis/sync');
  };
  detectCode = async () => {
    if (this.props.code) {
      try {
        await this.setState({ errored: false });
        const finalizeBody = {
          code: this.props.code
        };
        if (config.enedisForceUsagePoints) {
          finalizeBody.usage_points_id = config.enedisForceUsagePoints.split(',');
        }
        if (this.props.usage_point_id) {
          finalizeBody.usage_points_id = this.props.usage_point_id.split(',');
        }
        const response = await this.props.session.gatewayClient.finalizeEnedis(finalizeBody);
        this.setState({
          usagePointsIds: response.usage_points_id
        });
        await this.props.httpClient.post('/api/v1/service/enedis/variable/ENEDIS_USAGE_POINTS_ID', {
          value: JSON.stringify(response.usage_points_id)
        });
        const enedisIntegration = await this.props.httpClient.get(`/api/v1/service/enedis`, {
          pod_id: null
        });
        await Promise.each(response.usage_points_id, async usagePointId => {
          await this.createUsagePointDevice(usagePointId, enedisIntegration.id);
        });
        await this.props.session.gatewayClient.enedisRefreshAllData();
        route('/dashboard/integration/device/enedis');
      } catch (e) {
        console.error(e);
        await this.setState({ errored: true });
      }
    }
  };
  requestSyncGladysPlus = async () => {
    await this.props.session.gatewayClient.enedisRefreshAllData();
  };
  init = async () => {
    await this.setState({ loading: true });
    await Promise.all([this.getRedirectUri(), this.detectCode()]);
    await this.setState({ loading: false });
  };
  componentDidMount() {
    this.init();
  }
  render({}, { redirectUri, loading, errored, usagePointsIds, notOnGladysGateway }) {
    return (
      <EnedisPage user={this.props.user}>
        <EnedisWelcomePage
          redirectUri={redirectUri}
          loading={loading}
          errored={errored}
          usagePointsIds={usagePointsIds}
          notOnGladysGateway={notOnGladysGateway}
          sync={this.sync}
          requestSyncGladysPlus={this.requestSyncGladysPlus}
        />
      </EnedisPage>
    );
  }
}

export default withIntlAsProp(connect('user,session,httpClient', {})(EnedisWelcomePageComponent));
