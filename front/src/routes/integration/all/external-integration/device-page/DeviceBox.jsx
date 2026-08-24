import { Component } from 'preact';
import { Text, MarkupText, Localizer } from 'preact-i18n';
import cx from 'classnames';

import DeviceFeatures from '../../../../../components/device/view/DeviceFeatures';
import KeepHistoryFeature, { isHistorizableFeature } from './KeepHistoryFeature';
import DeviceParams from '../components/DeviceParams';
import TransportBadge from '../components/TransportBadge';
import { getDeviceTransport, getDeviceTransportMessage, isDeviceTransportDegraded } from '../utils';
import { RequestStatus } from '../../../../../utils/consts';

class DeviceBox extends Component {
  updateName = e => {
    this.props.updateDeviceField(this.props.deviceIndex, 'name', e.target.value);
  };

  updateRoom = e => {
    this.props.updateDeviceField(this.props.deviceIndex, 'room_id', e.target.value || null);
  };

  updateFeatureKeepHistory = (featureIndex, value) => {
    this.props.updateFeatureProperty(this.props.deviceIndex, featureIndex, 'keep_history', value);
  };

  saveDevice = async () => {
    this.setState({ loading: true });
    try {
      await this.props.saveDevice(this.props.deviceIndex);
      this.setState({ saveError: null, deleteError: null });
    } catch (e) {
      console.error(e);
      this.setState({ saveError: RequestStatus.Error });
    }
    this.setState({ loading: false });
  };

  deleteDevice = async () => {
    this.setState({ loading: true });
    try {
      await this.props.deleteDevice(this.props.deviceIndex);
      this.setState({ deleteError: null });
    } catch (e) {
      console.error(e);
      this.setState({ deleteError: RequestStatus.Error });
    }
    this.setState({ loading: false });
  };

  render({ device, deviceIndex, houses = [], language }, { loading, saveError, deleteError }) {
    // the index kept here is the one in device.features: it is what the
    // save posts back, the text features filtered out would shift it
    const historizableFeatures = (device.features || [])
      .map((feature, featureIndex) => ({ feature, featureIndex }))
      .filter(({ feature }) => isHistorizableFeature(feature));
    return (
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            {device.name}
            {getDeviceTransport(device) && (
              <div class="page-options d-flex">
                <TransportBadge
                  transport={getDeviceTransport(device)}
                  degraded={isDeviceTransportDegraded(device)}
                  message={getDeviceTransportMessage(device, language)}
                />
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
                {saveError && (
                  <div class="alert alert-danger">
                    <Text id="integration.externalIntegration.device.saveError" />
                  </div>
                )}
                {deleteError && (
                  <div class="alert alert-danger">
                    <Text id="integration.externalIntegration.device.deleteError" />
                  </div>
                )}
                <div class="form-group">
                  <label class="form-label" for={`name_${deviceIndex}`}>
                    <Text id="integration.externalIntegration.device.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      id={`name_${deviceIndex}`}
                      type="text"
                      value={device.name}
                      onInput={this.updateName}
                      class="form-control"
                      placeholder={<Text id="integration.externalIntegration.device.namePlaceholder" />}
                    />
                  </Localizer>
                </div>

                <div class="form-group">
                  <label class="form-label" for={`room_${deviceIndex}`}>
                    <Text id="integration.externalIntegration.device.roomLabel" />
                  </label>
                  <select onChange={this.updateRoom} class="form-control" id={`room_${deviceIndex}`}>
                    <option value="">
                      <Text id="global.emptySelectOption" />
                    </option>
                    {houses.map(house => (
                      <optgroup label={house.name}>
                        {house.rooms.map(room => (
                          <option selected={room.id === device.room_id} value={room.id}>
                            {room.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">
                    <Text id="integration.externalIntegration.device.featuresLabel" />
                  </label>
                  <DeviceFeatures features={device.features} />
                </div>

                {historizableFeatures.length > 0 && (
                  <div class="form-group">
                    <label class="form-label">
                      <Text id="editDeviceForm.keepHistoryLabel" />
                    </label>
                    {historizableFeatures.map(({ feature, featureIndex }) => (
                      <KeepHistoryFeature
                        key={feature.id || feature.external_id}
                        deviceIndex={deviceIndex}
                        feature={feature}
                        featureIndex={featureIndex}
                        updateFeatureKeepHistory={this.updateFeatureKeepHistory}
                      />
                    ))}
                    <p class="mb-0">
                      <small>
                        <MarkupText id="editDeviceForm.keepHistoryDescription" />
                      </small>
                    </p>
                  </div>
                )}

                <DeviceParams device={device} />

                <div class="d-flex">
                  <button onClick={this.saveDevice} class="btn btn-success mr-2 flex-fill">
                    <Text id="integration.externalIntegration.device.saveButton" />
                  </button>
                  <button onClick={this.deleteDevice} class="btn btn-danger flex-fill">
                    <Text id="integration.externalIntegration.device.deleteButton" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default DeviceBox;
