import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import get from 'get-value';
import cx from 'classnames';
import { RequestStatus } from '../../../../../utils/consts';

class MerossDeviceBox extends Component {
  saveDevice = async () => {
    this.setState({
      loading: true
    });
    try {
      await this.props.saveDevice(this.props.deviceIndex);
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
      loading: true
    });
    try {
      await this.props.deleteDevice(this.props.deviceIndex);
    } catch (e) {
      this.setState({
        error: RequestStatus.Error
      });
    }
    this.setState({
      loading: false
    });
  };
  testConnection = async () => {
    this.setState({
      loading: true
    });
    try {
      await this.props.testConnection(this.props.deviceIndex);
      this.setState({
        testConnectionError: null
      });
    } catch (e) {
      this.setState({
        testConnectionError: RequestStatus.Error
      });
    }
    this.setState({
      loading: false
    });
  };
  updateDeviceName = e => {
    this.props.updateDeviceField(this.props.deviceIndex, 'name', e.target.value);
  };
  updatePollFrequency = e => {
    this.props.updateDeviceField(this.props.deviceIndex, 'poll_frequency', parseInt(e.target.value, 10));
  };
  updateDeviceUrl = e => {
    this.props.updateDeviceUrl(this.props.deviceIndex, e.target.value);
  };
  updateDeviceRoom = e => {
    const newRoom = e.target.value === '' ? null : e.target.value;
    this.props.updateDeviceField(this.props.deviceIndex, 'room_id', newRoom);
  };
  componentWillMount() {}

  render(props, { loading, saveError, testConnectionError }) {
    return (
      <div class="col-md-4">
        <div class="card">
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
                    <Text id="integration.meross.saveError" />
                  </div>
                )}
                {testConnectionError && (
                  <div class="alert alert-danger">
                    <Text id="integration.meross.testConnectionError" />
                  </div>
                )}
                <div class="form-group">
                  <label>
                    <Text id="integration.meross.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      type="text"
                      value={props.device.name}
                      onInput={this.updateDeviceName}
                      class="form-control"
                      placeholder={<Text id="integration.meross.namePlaceholder" />}
                    />
                  </Localizer>
                </div>
                <div class="form-group">
                  <label>
                    <Text id="integration.meross.roomLabel" />
                  </label>
                  <select onChange={this.updateDeviceRoom} class="form-control">
                    <option value="">
                      <Text id="global.emptySelectOption" />
                    </option>
                    {props.housesWithRooms &&
                      props.housesWithRooms.map(house => (
                        <optgroup label={house.name}>
                          {house.rooms.map(room => (
                            <option selected={room.id === props.device.room_id} value={room.id}>
                              {room.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                  </select>
                </div>
                <div class="form-group">
                  <label>
                    <Text id="integration.meross.urlLabel" />
                  </label>
                  <Localizer>
                    <input
                      type="text"
                      value={get(props, 'device.deviceUrl.value')}
                      onInput={this.updateDeviceUrl}
                      class="form-control"
                      placeholder={<Text id="integration.meross.urlPlaceholder" />}
                    />
                  </Localizer>
                </div>
                <div class="form-group">
                  <button onClick={this.saveDevice} class="btn btn-success mr-2">
                    <Text id="integration.meross.saveButton" />
                  </button>
                  <button onClick={this.deleteDevice} class="btn btn-danger">
                    <Text id="integration.meross.deleteButton" />
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

export default MerossDeviceBox;
