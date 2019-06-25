import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import { RequestStatus } from '../../../../utils/consts';

class RtspCameraBox extends Component {
  saveCamera = async () => {
    this.setState({
      loading: true
    });
    try {
      await this.props.saveCamera(this.props.cameraIndex);
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
  deleteCamera = async () => {
    this.setState({
      loading: true
    });
    try {
      await this.props.deleteCamera(this.props.cameraIndex);
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
      await this.props.testConnection(this.props.cameraIndex);
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
  updateCameraName = e => {
    this.props.updateCameraField(this.props.cameraIndex, 'name', e.target.value);
  };
  updateCameraUrl = e => {
    this.props.updateCameraUrl(this.props.cameraIndex, e.target.value);
  };
  updateCameraRoom = e => {
    this.props.updateCameraField(this.props.cameraIndex, 'room_id', e.target.value);
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
              {props.camera.cameraImage && (
                <img class="card-img-top" src={`data:${props.camera.cameraImage}`} alt={props.camera.name} />
              )}
              <div class="card-body">
                {saveError && (
                  <div class="alert alert-danger">
                    <Text id="integration.rtspCamera.saveError" />
                  </div>
                )}
                {testConnectionError && (
                  <div class="alert alert-danger">
                    <Text id="integration.rtspCamera.testConnectionError" />
                  </div>
                )}
                <div class="form-group">
                  <label>
                    <Text id="integration.rtspCamera.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      type="text"
                      value={props.camera.name}
                      onInput={this.updateCameraName}
                      class="form-control"
                      placeholder={<Text id="integration.rtspCamera.namePlaceholder" />}
                    />
                  </Localizer>
                </div>
                <div class="form-group">
                  <label>
                    <Text id="integration.rtspCamera.roomLabel" />
                  </label>
                  <select onChange={this.updateCameraRoom} class="form-control">
                    <option value="">-------</option>
                    {props.houses &&
                      props.houses.map(house => (
                        <optgroup label={house.name}>
                          {house.rooms.map(room => (
                            <option selected={room.id === props.camera.room_id} value={room.id}>
                              {room.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                  </select>
                </div>
                <div class="form-group">
                  <label>
                    <Text id="integration.rtspCamera.urlLabel" />
                  </label>
                  <Localizer>
                    <input
                      type="text"
                      value={props.camera.cameraUrl.value}
                      onInput={this.updateCameraUrl}
                      class="form-control"
                      placeholder={<Text id="integration.rtspCamera.urlPlaceholder" />}
                    />
                  </Localizer>
                </div>
                <div class="form-group">
                  <button onClick={this.testConnection} class="btn btn-info mr-2">
                    <Text id="integration.rtspCamera.testConnectionButton" />
                  </button>
                  <button onClick={this.saveCamera} class="btn btn-success mr-2">
                    <Text id="integration.rtspCamera.saveButton" />
                  </button>
                  <button onClick={this.deleteCamera} class="btn btn-danger">
                    <Text id="integration.rtspCamera.deleteButton" />
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
