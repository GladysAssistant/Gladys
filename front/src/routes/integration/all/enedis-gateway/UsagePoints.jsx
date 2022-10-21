import { Component } from 'preact';
import { connect } from 'unistore/preact';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';

import { Text } from 'preact-i18n';
import cx from 'classnames';
import update from 'immutability-helper';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

import { getDeviceParam } from '../../../../utils/device';
import { DEVICE_PARAMS } from './consts';
import EnedisPage from './EnedisPage';

const UsagePointDevice = ({ device, language = 'fr', deviceIndex, updateDeviceParam, saveDevice }) => {
  const usagePointId = device.external_id.split(':')[1];

  const contractType = getDeviceParam(device, DEVICE_PARAMS.CONTRACT_TYPE);
  const pricePerKwh = getDeviceParam(device, DEVICE_PARAMS.PRICE_PER_KWH);
  const priceCurrency = getDeviceParam(device, DEVICE_PARAMS.PRICE_CURRENCY);

  const lastRefresh = dayjs()
    .locale(language)
    .format('L LTS');
  const numberOfStates = 124;

  const updateContractType = e => {
    updateDeviceParam(deviceIndex, DEVICE_PARAMS.CONTRACT_TYPE, e.target.value);
  };

  const save = () => {
    saveDevice(deviceIndex);
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
          <div class="form-group">
            <label>
              <Text id="integration.enedis.usagePoints.contractType" />
            </label>
            <select class="form-control" onChange={updateContractType} value={contractType}>
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
                  <span class="input-group-text">{priceCurrency}</span>
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
          <button class="btn btn-success" onClick={save}>
            <Text id="integration.enedis.usagePoints.saveButton" />
          </button>
        </div>
      </div>
    </div>
  );
};

const EnedisUsagePoints = ({ errored, loading, usagePointsDevices, updateDeviceParam, saveDevice }) => (
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
                          usagePointsDevices.map((usagePointDevice, index) => (
                            <UsagePointDevice
                              device={usagePointDevice}
                              deviceIndex={index}
                              updateDeviceParam={updateDeviceParam}
                              saveDevice={saveDevice}
                            />
                          ))}
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
  updateDeviceParam = (deviceIndex, deviceParam, value) => {
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
    this.setState({ usagePointsDevices: newUsagePointsDevices });
  };
  sync = async () => {
    await this.props.httpClient.post('/api/v1/service/enedis/sync');
  };
  saveDevice = async deviceIndex => {
    const device = this.state.usagePointsDevices[deviceIndex];
    await this.props.httpClient.post('/api/v1/device', device);
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
          updateDeviceParam={this.updateDeviceParam}
          saveDevice={this.saveDevice}
        />
      </EnedisPage>
    );
  }
}

export default connect('user,session,httpClient', {})(EnedisWelcomePageComponent);
