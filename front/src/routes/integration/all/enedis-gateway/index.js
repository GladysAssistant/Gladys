import { Component } from 'preact';
import { connect } from 'unistore/preact';
import uuid from 'uuid';
import Promise from 'bluebird';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import EnedisButton from './enedis-button.png';
import { route } from 'preact-router';
import {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS
} from '../../../../../../server/utils/constants';

const EnedisWelcomePage = ({ redirectUri, errored, loading, usagePointsIds, notOnGladysGateway, sync }) => (
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
                      {notOnGladysGateway && (
                        <p class="alert alert-info">
                          <Text id="integration.enedis.notOnGladysGateway" />
                        </p>
                      )}
                      {usagePointsIds && (
                        <p class="alert alert-success">
                          <Text
                            id="integration.enedis.connectedToUsagePointds"
                            plural={usagePointsIds.length}
                            fields={{ count: usagePointsIds.length }}
                          />{' '}
                          <Text id="integration.enedis.reconnectInfo" />
                        </p>
                      )}
                      <p>
                        <Text id="integration.enedis.longDescription" />
                      </p>
                      {usagePointsIds && (
                        <button class="btn btn-primary" onClick={sync}>
                          <Text id="integration.enedis.syncButton" /> Sync
                        </button>
                      )}
                      {!notOnGladysGateway && (
                        <div>
                          <p>
                            <Text id="integration.enedis.buttonDescription" />
                          </p>
                          <a href={redirectUri} target="_blank" rel="noreferrer noopener">
                            <Localizer>
                              <img src={EnedisButton} alt={<Text id="integration.enedis.buttonDescription" />} />
                            </Localizer>
                          </a>
                        </div>
                      )}
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
      const data = await this.props.httpClient.get('/api/v1/service/enedis/variable/ENEDIS_USAGE_POINTS_ID');
      const usagePointsIds = JSON.parse(data.value);
      this.setState({ usagePointsIds });
    } catch (e) {
      console.error(e);
    }
  };
  createUsagePointDevice = async (usagePointId, serviceId) => {
    const device = {
      name: 'Enedis',
      selector: `enedis-${usagePointId}`,
      external_id: `enedis:${usagePointId}`,
      service_id: serviceId,
      features: [
        {
          id: uuid.v4(),
          name: 'Enedis daily consumption',
          selector: `enedis-${usagePointId}-daily-consumption`,
          min: 0,
          max: 1000000,
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          external_id: `enedis:${usagePointId}:power`,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION,
          unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
          read_only: true,
          has_feedback: false,
          keep_history: true
        }
      ]
    };
    await this.props.httpClient.post('/api/v1/device', device);
  };
  sync = async () => {
    await this.props.httpClient.post('/api/v1/service/enedis/sync');
  };
  detectCode = async () => {
    if (this.props.code) {
      try {
        await this.setState({ errored: false });
        const response = await this.props.session.gatewayClient.finalizeEnedis(this.props.code);
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
        route('/dashboard/integration/device/enedis');
      } catch (e) {
        console.error(e);
        await this.setState({ errored: true });
      }
    }
  };
  init = async () => {
    await this.setState({ loading: true });
    await Promise.all([this.getRedirectUri(), this.detectCode(), this.getCurrentEnedisUsagePoints()]);
    await this.setState({ loading: false });
  };
  componentDidMount() {
    this.init();
  }
  render({}, { redirectUri, loading, errored, usagePointsIds, notOnGladysGateway }) {
    return (
      <EnedisWelcomePage
        redirectUri={redirectUri}
        loading={loading}
        errored={errored}
        usagePointsIds={usagePointsIds}
        notOnGladysGateway={notOnGladysGateway}
        sync={this.sync}
      />
    );
  }
}

export default connect('user,session,httpClient', {})(EnedisWelcomePageComponent);
