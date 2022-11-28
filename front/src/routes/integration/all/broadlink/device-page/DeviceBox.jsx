import { Text, Localizer, MarkupText } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import { Link } from 'preact-router/match';
import get from 'get-value';

import DeviceFeatures from '../../../../../components/device/view/DeviceFeatures';
import { RequestStatus } from '../../../../../utils/consts';

class DeviceBox extends Component {
  saveDevice = async () => {
    this.setState({
      loading: true
    });
    try {
      await this.props.saveDevice(this.props.device, this.props.deviceIndex);
      this.setState({
        saveError: null
      });
    } catch (e) {
      this.setState({
        saveError: RequestStatus.Error
      });
    }
    this.setState({
      loading: false
    });
  };

  deleteDevice = async () => {
    this.setState({
      loading: true,
      tooMuchStatesError: false,
      statesNumber: undefined
    });
    try {
      await this.props.deleteDevice(this.props.device, this.props.deviceIndex);
      this.setState({
        error: undefined,
        saveError: undefined
      });
    } catch (e) {
      const status = get(e, 'response.status');
      const dataMessage = get(e, 'response.data.message');
      if (status === 400 && dataMessage && dataMessage.includes('Too much states')) {
        const statesNumber = new Intl.NumberFormat().format(dataMessage.split(' ')[0]);
        this.setState({ tooMuchStatesError: true, statesNumber });
      } else {
        this.setState({ error: RequestStatus.Error });
      }
    }
    this.setState({
      loading: false
    });
  };

  updateDeviceName = e => {
    this.props.updateDeviceProperty(this.props.deviceIndex, 'name', e.target.value);
  };

  updateDeviceRoom = e => {
    this.props.updateDeviceProperty(this.props.deviceIndex, 'room_id', e.target.value);
  };

  render({ deviceIndex, device, housesWithRooms = [] }, { loading, saveError, tooMuchStatesError, statesNumber }) {
    return (
      <div class="col-md-6">
        <div class="card" data-cy="device-card">
          <div class="card-header">{device.name}</div>
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
                    <Text id="integration.broadlink.device.saveError" />
                  </div>
                )}
                {tooMuchStatesError && (
                  <div class="alert alert-warning">
                    <MarkupText id="device.tooMuchStatesToDelete" fields={{ count: statesNumber }} />
                  </div>
                )}
                <div class="form-group">
                  <label class="form-label" for={`name_${deviceIndex}`}>
                    <Text id="integration.broadlink.device.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      type="text"
                      value={device.name}
                      onInput={this.updateDeviceName}
                      class="form-control"
                      data-cy="device-name"
                      placeholder={<Text id="integration.broadlink.device.namePlaceholder" />}
                    />
                  </Localizer>
                </div>
                <div class="form-group">
                  <label class="form-label">
                    <Text id="integration.broadlink.device.modelLabel" />
                  </label>
                  <Localizer>
                    <input
                      type="text"
                      value={<Text id={`deviceFeatureCategory.${device.model}.shortCategoryName`}>{device.model}</Text>}
                      class="form-control"
                      disabled
                      data-cy="device-model"
                    />
                  </Localizer>
                </div>
                <div class="form-group">
                  <label class="form-label" for={`room_${deviceIndex}`}>
                    <Text id="integration.broadlink.device.roomLabel" />
                  </label>
                  <select onChange={this.updateDeviceRoom} class="form-control" id={`room_${deviceIndex}`}>
                    <option value="">
                      <Text id="global.emptySelectOption" />
                    </option>
                    {housesWithRooms.map(house => (
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
                    <Text id="integration.broadlink.device.featuresLabel" />
                  </label>
                  <DeviceFeatures features={device.features} />
                </div>

                <div class="form-group">
                  <button onClick={this.saveDevice} class="btn btn-success mr-2">
                    <Text id="integration.broadlink.device.saveButton" />
                  </button>
                  <button onClick={this.deleteDevice} class="btn btn-danger">
                    <Text id="integration.broadlink.device.deleteButton" />
                  </button>

                  <Link href={`/dashboard/integration/device/broadlink/edit/${device.selector}`}>
                    <button class="btn btn-secondary float-right">
                      <Text id="integration.broadlink.device.editButton" />
                    </button>
                  </Link>
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
