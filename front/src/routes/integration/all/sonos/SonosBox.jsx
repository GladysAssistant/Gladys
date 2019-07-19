import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import { RequestStatus } from '../../../../utils/consts';

class RtspCameraBox extends Component {
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
  updateDeviceName = e => {
    this.props.updateDeviceField(this.props.deviceIndex, 'name', e.target.value);
  };
  updateDeviceSpotifyRegion = e => {
    this.props.updateDeviceSpotifyRegion(this.props.deviceIndex, e.target.value);
  };
  updateSelectedDevice = e => {
    const device = this.props.sonosDevicesDetected.find(sonosDevice => sonosDevice.udn === e.target.value);
    this.props.updateSelectedDevice(this.props.deviceIndex, device);
  };
  updateDeviceRoom = e => {
    this.props.updateDeviceField(this.props.deviceIndex, 'room_id', e.target.value);
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
                    <Text id="integration.sonos.saveError" />
                  </div>
                )}
                {testConnectionError && (
                  <div class="alert alert-danger">
                    <Text id="integration.sonos.testConnectionError" />
                  </div>
                )}
                <div class="form-group">
                  <label>
                    <Text id="integration.sonos.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      type="text"
                      value={props.device.name}
                      onInput={this.updateCameraName}
                      class="form-control"
                      placeholder={<Text id="integration.sonos.namePlaceholder" />}
                    />
                  </Localizer>
                </div>
                <div class="form-group">
                  <label>
                    <Text id="integration.sonos.sonosDeviceLabel" />
                  </label>
                  <select onChange={this.updateSelectedSonosDevice} class="form-control">
                    <option value="">-------</option>
                    {props.sonosDevicesDetected &&
                      props.sonosDevicesDetected.map(sonosDevice => (
                        <option
                          selected={`sonos:${sonosDevice.udn}` === props.device.external_id}
                          value={sonosDevice.udn}
                        >
                          {sonosDevice.model_name} - {sonosDevice.room_name}
                        </option>
                      ))}
                  </select>
                </div>
                <div class="form-group">
                  <label>
                    <Text id="integration.sonos.roomLabel" />
                  </label>
                  <select onChange={this.updateCameraRoom} class="form-control">
                    <option value="">-------</option>
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
                    <Text id="integration.sonos.spotifyRegionLabel" />
                  </label>
                  <select onChange={this.updateDeviceSpotifyRegion} class="form-control">
                    <option value="">-------</option>
                    <option value="EU">
                      <Text id="integration.sonos.spotifyRegionEU" />
                    </option>
                    <option value="US">
                      <Text id="integration.sonos.spotifyRegionUS" />
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <button onClick={this.testConnection} class="btn btn-info mr-2">
                    <Text id="integration.sonos.testConnectionButton" />
                  </button>
                  <button onClick={this.saveDevice} class="btn btn-success mr-2">
                    <Text id="integration.sonos.saveButton" />
                  </button>
                  <button onClick={this.deleteDevice} class="btn btn-danger">
                    <Text id="integration.sonos.deleteButton" />
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

export default RtspCameraBox;
