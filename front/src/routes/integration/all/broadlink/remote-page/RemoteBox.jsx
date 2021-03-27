import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import get from 'get-value';
import { Link } from 'preact-router/match';
import { DeviceFeatureCategoriesIcon, RequestStatus } from '../../../../../utils/consts';

class RemoteBox extends Component {
  saveRemote = async () => {
    this.setState({
      loading: true
    });
    try {
      await this.props.saveDevice(this.props.remote, this.props.remoteIndex);
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

  deleteRemote = async () => {
    this.setState({
      loading: true
    });
    try {
      await this.props.deleteDevice(this.props.remote, this.props.remoteIndex);
    } catch (e) {
      this.setState({
        error: RequestStatus.Error
      });
    }
    this.setState({
      loading: false
    });
  };

  updateRemoteName = e => {
    this.props.updateDeviceProperty(this.props.remoteIndex, 'name', e.target.value);
  };

  updateRemoteRoom = e => {
    this.props.updateDeviceProperty(this.props.remoteIndex, 'room_id', e.target.value);
  };

  render(props, { loading, saveError }) {
    const isRemote = props.remote.model.startsWith('remote-control:');
    return (
      <div class="col-md-6">
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
                    <Text id="integration.broadlink.remote.saveError" />
                  </div>
                )}
                <div class="form-group">
                  <label class="form-label" for={`name_${props.remoteIndex}`}>
                    <Text id="integration.broadlink.remote.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      type="text"
                      id={`name_${props.remoteIndex}`}
                      value={props.remote.name}
                      onInput={this.updateRemoteName}
                      class="form-control"
                      placeholder={<Text id="integration.broadlink.remote.namePlaceholder" />}
                    />
                  </Localizer>
                </div>
                <div class="form-group">
                  <label class="form-label" for={`room_${props.remoteIndex}`}>
                    <Text id="integration.broadlink.remote.roomLabel" />
                  </label>
                  <select onChange={this.updateRemoteRoom} class="form-control" id={`room_${props.remoteIndex}`}>
                    <option value="">
                      <Text id="global.emptySelectOption" />
                    </option>
                    {props.houses &&
                      props.houses.map(house => (
                        <optgroup label={house.name}>
                          {house.rooms.map(room => (
                            <option selected={room.id === props.remote.room_id} value={room.id}>
                              {room.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                  </select>
                </div>

                {!isRemote && (
                  <div class="form-group">
                    <label class="form-label">
                      <Text id="integration.broadlink.remote.featuresLabel" />
                    </label>
                    <div class="tags">
                      {props.remote.features &&
                        props.remote.features.map(feature => (
                          <span class="tag">
                            <Text id={`deviceFeatureCategory.${feature.category}.${feature.type}`} />
                            <div class="tag-addon">
                              <i
                                class={`fe fe-${get(
                                  DeviceFeatureCategoriesIcon,
                                  `${feature.category}.${feature.type}`
                                )}`}
                              />
                            </div>
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                <div class="form-group">
                  <button onClick={this.saveRemote} class="btn btn-success mr-2">
                    <Text id="integration.broadlink.remote.saveButton" />
                  </button>
                  <button onClick={this.deleteRemote} class="btn btn-danger">
                    <Text id="integration.broadlink.remote.deleteButton" />
                  </button>

                  {isRemote && (
                    <Link href={`/dashboard/integration/device/broadlink/edit/${props.remote.selector}`}>
                      <button class="btn btn-secondary float-right">
                        <Text id="integration.mqtt.device.editButton" />
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default RemoteBox;
