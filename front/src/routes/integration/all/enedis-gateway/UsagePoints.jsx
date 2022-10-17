import { Component } from 'preact';
import { connect } from 'unistore/preact';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';

import { Text } from 'preact-i18n';
import cx from 'classnames';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

import EnedisPage from './EnedisPage';

const UsagePointDevice = ({ device, language = 'fr' }) => {
  const usagePointId = device.external_id.split(':')[1];
  const contractType = 'base';
  const pricePerKwh = 1.74;
  const priceUnit = '€';
  const lastRefresh = dayjs()
    .locale(language)
    .format('L LTS');
  const numberOfStates = 124;

  return (
    <div class="col-md-6">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <Text id="integration.enedis.usagePoints.usagePointName" />
          </h3>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label>
              <Text id="integration.enedis.usagePoints.usagePointId" />
            </label>
            <input type="text" class="form-control" value={usagePointId} disabled />
          </div>
          <div class="form-group">
            <label>
              <Text id="integration.enedis.usagePoints.contractType" />
            </label>
            <select class="form-control" value={contractType}>
              <option value="base">
                <Text id="integration.enedis.usagePoints.contracts.base" />
              </option>
              <option value="hc-hp">
                <Text id="integration.enedis.usagePoints.contracts.hc-hp" />
              </option>
            </select>
          </div>
          {contractType === 'base' && (
            <div class="form-group">
              <label>
                <Text id="integration.enedis.usagePoints.pricePerKwh" />
              </label>
              <div class="input-group">
                <input type="text" class="form-control" value={pricePerKwh} />
                <div class="input-group-append">
                  <span class="input-group-text">{priceUnit}</span>
                </div>
              </div>
            </div>
          )}
          <div class="card">
            <div class="card-body">
              <h4>
                <Text id="integration.enedis.usagePoints.statistics" />
              </h4>
              <p>
                <b>
                  <Text id="integration.enedis.usagePoints.lastSyncLabel" />
                </b>{' '}
                {lastRefresh}
                <br />
                <b>
                  <Text id="integration.enedis.usagePoints.firstValueLabel" />
                </b>{' '}
                {lastRefresh}
                <br />
                <b>
                  <Text id="integration.enedis.usagePoints.lastValueLabel" />
                </b>{' '}
                {lastRefresh}
                <br />
                <b>
                  <Text id="integration.enedis.usagePoints.numberOfStatesLabel" />
                </b>{' '}
                {numberOfStates}
                <br />
              </p>
            </div>
          </div>
          <button class="btn btn-primary">
            <Text id="integration.enedis.usagePoints.syncButton" />
          </button>
        </div>
      </div>
    </div>
  );
};

const EnedisUsagePoints = ({ errored, loading, usagePointsDevices }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="row">
            <div class="col-lg-12">
              <div class="card">
                <div class="card-header">
                  <h3 class="card-title">
                    <Text id="integration.enedis.usagePoints.title" />
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
                          <Text id="integration.enedis.welcome.error" />
                        </p>
                      )}

                      <div class="row">
                        {usagePointsDevices &&
                          usagePointsDevices.map(usagePointDevice => <UsagePointDevice device={usagePointDevice} />)}
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
  </div>
);

class EnedisWelcomePageComponent extends Component {
  getCurrentEnedisUsagePoints = async () => {
    try {
      const usagePointsDevices = await this.props.httpClient.get('/api/v1/service/enedis/device');
      this.setState({ usagePointsDevices });
    } catch (e) {
      console.error(e);
    }
  };
  sync = async () => {
    await this.props.httpClient.post('/api/v1/service/enedis/sync');
  };
  init = async () => {
    await this.setState({ loading: true });
    await this.getCurrentEnedisUsagePoints();
    await this.setState({ loading: false });
  };
  componentDidMount() {
    this.init();
  }
  render({ user }, { loading, errored, usagePointsDevices }) {
    return (
      <EnedisPage>
        <EnedisUsagePoints
          loading={loading}
          errored={errored}
          usagePointsDevices={usagePointsDevices}
          sync={this.sync}
          language={user.language}
        />
      </EnedisPage>
    );
  }
}

export default connect('user,session,httpClient', {})(EnedisWelcomePageComponent);
