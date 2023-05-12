import { Text, Localizer, MarkupText } from 'preact-i18n';
import { Component } from 'preact';
import get from 'get-value';
import cx from 'classnames';
import { RequestStatus } from '../../../../utils/consts';
import { DEVICE_POLL_FREQUENCIES } from '../../../../../../server/utils/constants';

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
        testConnectionError: null,
        testConnectionErrorMessage: null
      });
    } catch (e) {
      this.setState({
        testConnectionError: RequestStatus.Error,
        testConnectionErrorMessage: get(e, 'response.data.error')
      });
    }
    this.setState({
      loading: false
    });
  };
  updateCameraName = e => {
    this.props.updateCameraField(this.props.cameraIndex, 'name', e.target.value);
  };
  updatePollFrequency = e => {
    this.props.updateCameraField(this.props.cameraIndex, 'poll_frequency', parseInt(e.target.value, 10));
  };
  updateCameraUrl = e => {
    this.props.updateCameraUrl(this.props.cameraIndex, e.target.value);
  };
  updateCameraRotation = e => {
    const newValue = e.target.checked ? '1' : '0';
    this.props.updateCameraRotation(this.props.cameraIndex, newValue);
  };
  updateCameraRoom = e => {
    const newRoom = e.target.value === '' ? null : e.target.value;
    this.props.updateCameraField(this.props.cameraIndex, 'room_id', newRoom);
  };
  componentWillMount() {}

  render(props, { loading, saveError, testConnectionError, testConnectionErrorMessage }) {
    return (
      <div class="col-lg-4">
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
                {testConnectionErrorMessage && <div class="alert alert-danger">{testConnectionErrorMessage}</div>}
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
                    <option value="">
                      <Text id="global.emptySelectOption" />
                    </option>
                    {props.housesWithRooms &&
                      props.housesWithRooms.map(house => (
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
                    <Text id="integration.rtspCamera.pollFrequencyLabel" />
                  </label>
                  <select onChange={this.updatePollFrequency} value={props.camera.poll_frequency} class="form-control">
                    <option value={DEVICE_POLL_FREQUENCIES.EVERY_MINUTES}>
                      <Text id="integration.rtspCamera.everyMinutes" />
                    </option>
                    <option value={DEVICE_POLL_FREQUENCIES.EVERY_30_SECONDS}>
                      <Text id="integration.rtspCamera.every30Seconds" />
                    </option>
                    <option value={DEVICE_POLL_FREQUENCIES.EVERY_10_SECONDS}>
                      <Text id="integration.rtspCamera.every10Seconds" />
                    </option>
                    <option value={DEVICE_POLL_FREQUENCIES.EVERY_2_SECONDS}>
                      <Text id="integration.rtspCamera.every2Seconds" />
                    </option>
                    <option value={DEVICE_POLL_FREQUENCIES.EVERY_SECONDS}>
                      <Text id="integration.rtspCamera.every1Seconds" />
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label>
                    <Text id="integration.rtspCamera.urlLabel" />
                  </label>
                  <Localizer>
                    <input
                      type="text"
                      value={get(props, 'camera.cameraUrl.value')}
                      onInput={this.updateCameraUrl}
                      class="form-control"
                      placeholder={<Text id="integration.rtspCamera.urlPlaceholder" />}
                    />
                  </Localizer>
                  <p class="mt-2">
                    <small>
                      <MarkupText id="integration.rtspCamera.urlExplanation" />
                    </small>
                  </p>
                </div>
                <div class="form-group">
                  <label class="custom-switch">
                    <input
                      type="checkbox"
                      id="cameraRotate"
                      name="cameraRotate"
                      class="custom-switch-input"
                      checked={get(props, 'camera.cameraRotation.value') === '1'}
                      onClick={this.updateCameraRotation}
                    />
                    <span class="custom-switch-indicator" />
                    <span class="custom-switch-description">
                      <Text id="integration.rtspCamera.rotate180Label" />
                    </span>
                  </label>
                </div>
                <div class="form-group">
                  <button onClick={this.testConnection} class="btn btn-info mr-2">
                    <Text id="integration.rtspCamera.testConnectionButton" />
                  </button>
                  <button onClick={this.saveCamera} class="btn btn-success mr-2">
                    <Text id="integration.rtspCamera.saveButton" />
                  </button>
                  <button onClick={this.deleteCamera} class="btn btn-danger mt-4 mt-lg-0">
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
