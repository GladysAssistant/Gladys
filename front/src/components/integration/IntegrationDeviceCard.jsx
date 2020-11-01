import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router';
import get from 'get-value';
import cx from 'classnames';
import { connect } from 'unistore/preact';
import update from 'immutability-helper';

import { RequestStatus } from '../../utils/consts';
import { DEVICE_FEATURE_CATEGORIES } from '../../../../server/utils/constants';

import IntegrationDeviceFields from './IntegrationDeviceFields';

@connect('httpClient,user')
class IntegrationDeviceCard extends Component {
  updateDeviceProperty = (property, e) => {
    e.preventDefault();

    const device = update(this.state.device, {
      [property]: {
        $set: e.target.value
      }
    });

    this.setState({
      device
    });
  };

  updateName = e => {
    this.updateDeviceProperty('name', e);
  };

  updateRoom = e => {
    this.updateDeviceProperty('room_id', e);
  };

  async saveDevice() {
    this.setState({
      loading: true,
      saveStatus: RequestStatus.Getting
    });
    try {
      const device = await this.props.httpClient.post('/api/v1/device', this.state.device);
      this.setState({
        saveStatus: RequestStatus.Success,
        loading: false,
        update: false,
        device
      });
    } catch (e) {
      const status = get(e, 'response.status');
      if (status === 409) {
        this.setState({
          saveStatus: RequestStatus.ConflictError,
          loading: false
        });
      } else {
        this.setState({
          saveStatus: RequestStatus.Error,
          loading: false
        });
      }
    }
  }

  async deleteDevice() {
    this.setState({
      loading: true,
      saveStatus: RequestStatus.Getting
    });
    try {
      await this.props.httpClient.delete(`/api/v1/device/${this.state.device.selector}`);
      this.setState({
        saveStatus: RequestStatus.Success,
        loading: false,
        device: undefined
      });
    } catch (e) {
      this.setState({
        saveStatus: RequestStatus.Error,
        loading: false
      });
    }
  }

  constructor(props) {
    super(props);

    const { device } = props;
    const { features = [] } = device;
    const batteryLevelDeviceFeature = features.find(
      deviceFeature => deviceFeature.category === DEVICE_FEATURE_CATEGORIES.BATTERY
    );
    const batteryLevel = get(batteryLevelDeviceFeature, 'last_value');

    this.state = {
      batteryLevel,
      device,
      loading: false
    };

    this.saveDevice = this.saveDevice.bind(this);
    this.deleteDevice = this.deleteDevice.bind(this);
  }

  render({ children, disableForm, houses = [], editUrl, user }, { device, batteryLevel, loading, saveStatus }) {
    if (!device) {
      return null;
    }

    return (
      <div class="card">
        <div class="card-header">
          {device.name || <Text id="editDeviceForm.noName" />}
          {batteryLevel && (
            <div class="page-options d-flex">
              <div class="tag tag-green">
                <Text id="global.percentValue" fields={{ value: batteryLevel }} />
                <span class="tag-addon">
                  <i class="fe fe-battery" />
                </span>
              </div>
            </div>
          )}
        </div>
        <div
          class={cx('dimmer', {
            active: loading
          })}
        >
          <div class="loader" />
          <div class="dimmer-content">
            <div class="card-body">
              {saveStatus === RequestStatus.Error && (
                <div class="alert alert-danger">
                  <Text id="editDeviceForm.saveError" />
                </div>
              )}
              {saveStatus === RequestStatus.ConflictError && (
                <div class="alert alert-danger">
                  <Text id="editDeviceForm.saveConflictError" />
                </div>
              )}
              <IntegrationDeviceFields
                disableForm={disableForm}
                houses={houses}
                device={device}
                updateName={this.updateName}
                updateRoom={this.updateRoom}
                user={user}
              >
                {children}
              </IntegrationDeviceFields>
              <div class="form-group">
                <button onClick={this.saveDevice} class="btn btn-success mr-2" disabled={disableForm}>
                  <Text id="editDeviceForm.saveButton" />
                </button>
                <button onClick={this.deleteDevice} class="btn btn-danger" disabled={disableForm}>
                  <Text id="editDeviceForm.deleteButton" />
                </button>
                {editUrl && (
                  <Link href={editUrl}>
                    <button class="btn btn-secondary float-right" disabled={disableForm}>
                      <Text id="editDeviceForm.editButton" />
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default IntegrationDeviceCard;
