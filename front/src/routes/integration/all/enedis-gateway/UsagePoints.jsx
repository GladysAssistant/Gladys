import { Component } from 'preact';
import { connect } from 'unistore/preact';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import withIntlAsProp from '../../../../utils/withIntlAsProp';

import { Text } from 'preact-i18n';
import cx from 'classnames';
import update from 'immutability-helper';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

import { getDeviceParam } from '../../../../utils/device';
import { DEVICE_PARAMS } from './consts';
import EnedisPage from './EnedisPage';
import { buildUsagePointDevicePayload } from './usagePointDeviceBuilder';

const UsagePointDevice = ({
  device,
  language = 'fr',
  deviceIndex,
  saveDevice,
  destroyDevice,
  reCreateUsagePointDevice,
  syncs = []
}) => {
  const usagePointId = device.external_id.split(':')[1];

  const lastRefresh = getDeviceParam(device, DEVICE_PARAMS.LAST_REFRESH);
  const numberOfStates = getDeviceParam(device, DEVICE_PARAMS.NUMBER_OF_STATES);
  const mySyncs = syncs.filter(sync => sync.usage_point_id === usagePointId);
  const deviceShouldBeUpdated = device.features.length < 3;

  let syncInProgress;
  if (mySyncs.length > 0) {
    const lastSync = mySyncs[0];
    if (lastSync.jobs_done < lastSync.jobs_total) {
      syncInProgress = lastSync;
      syncInProgress.progress = Math.round((lastSync.jobs_done / lastSync.jobs_total) * 100);
    }
  }

  const lastRefreshDate = lastRefresh
    ? dayjs(lastRefresh)
        .locale(language)
        .format('L LTS')
    : undefined;

  const save = () => {
    saveDevice(deviceIndex);
  };

  const destroy = () => {
    destroyDevice(deviceIndex);
  };

  const reCreate = () => {
    reCreateUsagePointDevice(usagePointId, deviceIndex);
  };

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
          {syncInProgress && (
            <div class="form-group">
              <label>
                <Text id="integration.enedis.usagePoints.gladysPlusRefreshProgressLabel" />
              </label>
              <div class="progress">
                <div
                  class="progress-bar bg-primary"
                  style={{
                    width: `${syncInProgress.progress}%`
                  }}
                  role="progressbar"
                  aria-valuenow={syncInProgress.progress}
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-label={syncInProgress.progress}
                >
                  <span class="visually-hidden">{syncInProgress.progress}%</span>
                </div>
              </div>
              <div class="mt-2">
                <small>
                  <Text id="integration.enedis.usagePoints.gladysPlusRefreshProgressDescription" />
                </small>
              </div>
            </div>
          )}
          {(lastRefreshDate || numberOfStates) && (
            <div class="card">
              <div class="card-body">
                <h4>
                  <Text id="integration.enedis.usagePoints.statistics" />
                </h4>
                <p>
                  {lastRefreshDate && (
                    <span>
                      <b>
                        <Text id="integration.enedis.usagePoints.lastSyncLabel" />
                      </b>{' '}
                      {lastRefresh}
                      <br />
                    </span>
                  )}
                  {numberOfStates && (
                    <span>
                      <b>
                        <Text id="integration.enedis.usagePoints.numberOfStatesLabel" />
                      </b>{' '}
                      {numberOfStates}
                      <br />
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
          <button class="btn btn-success" onClick={save}>
            <Text id="integration.enedis.usagePoints.saveButton" />
          </button>
          <button class="btn btn-danger ml-2" onClick={destroy}>
            <Text id="integration.enedis.usagePoints.deleteButton" />
          </button>
          {deviceShouldBeUpdated && (
            <button class="btn btn-primary ml-2" onClick={reCreate}>
              <Text id="integration.enedis.usagePoints.recreateButton" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const EnedisUsagePoints = ({
  errored,
  loading,
  usagePointsDevices,
  updateDeviceParam,
  saveDevice,
  destroyDevice,
  reCreateUsagePointDevice,
  syncs,
  sync
}) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.enedis.usagePoints.title" />
      </h1>
      <div class="page-options d-flex">
        {usagePointsDevices && usagePointsDevices.length > 0 && (
          <button class="btn btn-primary" onClick={sync}>
            <i class="fe fe-refresh-cw" />{' '}
            <span class="d-none d-sm-inline-block ml-2">
              <Text id="integration.enedis.usagePoints.refreshLocal" />
            </span>
          </button>
        )}
      </div>
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

          {usagePointsDevices && usagePointsDevices.length === 0 && (
            <p class="alert alert-info">
              <Text id="integration.enedis.usagePoints.emptyState" />
            </p>
          )}

          {usagePointsDevices && usagePointsDevices.length > 0 && (
            <p class="alert alert-primary">
              <Text id="integration.enedis.usagePoints.explanation" />
            </p>
          )}

          <div class="row">
            {usagePointsDevices &&
              usagePointsDevices.map((usagePointDevice, index) => (
                <UsagePointDevice
                  device={usagePointDevice}
                  deviceIndex={index}
                  updateDeviceParam={updateDeviceParam}
                  saveDevice={saveDevice}
                  destroyDevice={destroyDevice}
                  reCreateUsagePointDevice={reCreateUsagePointDevice}
                  syncs={syncs}
                />
              ))}
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
  updateDeviceParam = async (deviceIndex, deviceParam, value) => {
    const device = this.state.usagePointsDevices[deviceIndex];
    const deviceParamIndex = device.params.findIndex(p => p.name === deviceParam);
    let newUsagePointsDevices;
    if (deviceParamIndex !== -1) {
      newUsagePointsDevices = update(this.state.usagePointsDevices, {
        [deviceIndex]: {
          params: {
            [deviceParamIndex]: {
              value: {
                $set: value
              }
            }
          }
        }
      });
    } else {
      newUsagePointsDevices = update(this.state.usagePointsDevices, {
        [deviceIndex]: {
          params: {
            $push: [
              {
                name: deviceParam,
                value
              }
            ]
          }
        }
      });
    }
    await this.setState({ usagePointsDevices: newUsagePointsDevices });
  };
  getCurrentSync = async () => {
    try {
      const syncs = await this.props.session.gatewayClient.enedisGetSync();
      this.setState({ syncs });
    } catch (e) {
      console.error(e);
    }
  };
  sync = async () => {
    await this.setState({ loading: true });
    try {
      await this.props.httpClient.post('/api/v1/service/enedis/sync');
    } catch (e) {
      console.error(e);
    }
    await this.setState({ loading: false });
  };
  saveDevice = async deviceIndex => {
    await this.setState({ loading: true });
    try {
      const device = this.state.usagePointsDevices[deviceIndex];
      await this.props.httpClient.post('/api/v1/device', device);
    } catch (e) {
      console.error(e);
    }
    await this.setState({ loading: false });
  };
  destroyDevice = async deviceIndex => {
    await this.setState({ loading: true });
    try {
      const device = this.state.usagePointsDevices[deviceIndex];
      await this.props.httpClient.delete(`/api/v1/device/${device.selector}`);
      await this.getCurrentEnedisUsagePoints();
      await this.getCurrentSync();
    } catch (e) {
      console.error(e);
    }
    await this.setState({ loading: false });
  };
  reCreateUsagePointDevice = async (usagePointId, deviceIndex) => {
    const existingDevice = this.state.usagePointsDevices[deviceIndex];
    const enedisIntegration = await this.props.httpClient.get(`/api/v1/service/enedis`, {
      pod_id: null
    });
    const serviceId = enedisIntegration.id;

    const device = buildUsagePointDevicePayload({
      usagePointId,
      serviceId,
      intlDictionary: this.props.intl.dictionary,
      existingDevice
    });

    await this.props.httpClient.post('/api/v1/device', device);
    await this.getCurrentEnedisUsagePoints();
  };
  init = async () => {
    await this.setState({ loading: true });
    await this.getCurrentEnedisUsagePoints();
    await this.getCurrentSync();
    await this.setState({ loading: false });
  };
  componentDidMount() {
    this.init();
    this.refreshInterval = setInterval(this.getCurrentSync, 30 * 1000);
  }
  componentWillUnmount() {
    clearInterval(this.refreshInterval);
  }
  render({ user }, { loading, errored, usagePointsDevices, syncs }) {
    return (
      <EnedisPage user={this.props.user}>
        <EnedisUsagePoints
          loading={loading}
          errored={errored}
          usagePointsDevices={usagePointsDevices}
          sync={this.sync}
          syncs={syncs}
          language={user.language}
          updateDeviceParam={this.updateDeviceParam}
          saveDevice={this.saveDevice}
          destroyDevice={this.destroyDevice}
          reCreateUsagePointDevice={this.reCreateUsagePointDevice}
        />
      </EnedisPage>
    );
  }
}

export default connect('user,session,httpClient', {})(withIntlAsProp(EnedisWelcomePageComponent));
