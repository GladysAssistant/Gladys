import { Text, Localizer, MarkupText } from 'preact-i18n';
import { Component } from 'preact';
import get from 'get-value';
import cx from 'classnames';
import { RequestStatus } from '../../../../utils/consts';
import { DEVICE_POLL_FREQUENCIES, DEVICE_ROTATION } from '../../../../../../server/utils/constants';
import { MobileField, fieldClass } from '../../../../components/mobile';
import { MobileDeviceItem } from '../../../../components/integration/mobile';
import style from './style.css';

const POLL_FREQUENCY_OPTIONS = [
  { value: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES, label: 'integration.rtspCamera.everyMinutes' },
  { value: DEVICE_POLL_FREQUENCIES.EVERY_30_SECONDS, label: 'integration.rtspCamera.every30Seconds' },
  { value: DEVICE_POLL_FREQUENCIES.EVERY_10_SECONDS, label: 'integration.rtspCamera.every10Seconds' },
  { value: DEVICE_POLL_FREQUENCIES.EVERY_2_SECONDS, label: 'integration.rtspCamera.every2Seconds' },
  { value: DEVICE_POLL_FREQUENCIES.EVERY_SECONDS, label: 'integration.rtspCamera.every1Seconds' }
];

const ROTATION_OPTIONS = [
  { value: DEVICE_ROTATION.DEGREES_0, label: 'integration.rtspCamera.rotationO' },
  { value: DEVICE_ROTATION.DEGREES_90, label: 'integration.rtspCamera.rotation90' },
  { value: DEVICE_ROTATION.DEGREES_180, label: 'integration.rtspCamera.rotation18O' },
  { value: DEVICE_ROTATION.DEGREES_270, label: 'integration.rtspCamera.rotation27O' }
];

class RtspCameraBox extends Component {
  // The three requests resolve to false when they failed: the phone sheet then stays open with
  // the error (docs/specs/mobile-pages/integration-devices.md, B). `lastError` tells which
  // request failed last, the sheet showing one error at a time.
  saveCamera = async () => {
    this.setState({
      loading: true
    });
    let saved = true;
    try {
      await this.props.saveCamera(this.props.cameraIndex);
      this.setState({
        saveError: null,
        lastError: null
      });
    } catch (e) {
      saved = false;
      this.setState({
        saveError: RequestStatus.Error,
        lastError: 'save'
      });
    }
    this.setState({
      loading: false
    });
    return saved;
  };
  deleteCamera = async () => {
    this.setState({
      loading: true,
      tooMuchStatesError: false,
      statesNumber: undefined
    });
    let deleted = true;
    try {
      await this.props.deleteCamera(this.props.cameraIndex);
    } catch (e) {
      deleted = false;
      const status = get(e, 'response.status');
      const dataMessage = get(e, 'response.data.message');
      if (status === 400 && dataMessage && dataMessage.includes('Too much states')) {
        const statesNumber = new Intl.NumberFormat().format(dataMessage.split(' ')[0]);
        this.setState({ tooMuchStatesError: true, statesNumber });
      }
      this.setState({
        error: RequestStatus.Error
      });
    }
    this.setState({
      loading: false
    });
    return deleted;
  };
  testConnection = async () => {
    this.setState({
      loading: true
    });
    let tested = true;
    try {
      await this.props.testConnection(this.props.cameraIndex);
      this.setState({
        testConnectionError: null,
        testConnectionErrorMessage: null,
        lastError: null
      });
    } catch (e) {
      tested = false;
      this.setState({
        testConnectionError: RequestStatus.Error,
        testConnectionErrorMessage: get(e, 'response.data.error'),
        lastError: 'test'
      });
    }
    this.setState({
      loading: false
    });
    return tested;
  };
  // the sheet of a camera that was never saved, closed without saving it: the camera leaves the
  // list (nothing is requested, it only exists in the page)
  discardCamera = () => {
    this.props.deleteCamera(this.props.cameraIndex);
  };
  // "Close without saving": back to the frequency, the URL and the rotation the sheet opened on
  // (the name and the room are undone by the sheet itself)
  revertCamera = saved => {
    const { camera, cameraIndex } = this.props;
    if (camera.poll_frequency !== saved.poll_frequency) {
      this.props.updateCameraField(cameraIndex, 'poll_frequency', saved.poll_frequency);
    }
    if (get(camera, 'cameraUrl.value') !== get(saved, 'cameraUrl.value')) {
      this.props.updateCameraUrl(cameraIndex, get(saved, 'cameraUrl.value'));
    }
    if (get(camera, 'cameraRotation.value') !== get(saved, 'cameraRotation.value')) {
      this.props.updateCameraRotation(cameraIndex, get(saved, 'cameraRotation.value'));
    }
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
    this.props.updateCameraRotation(this.props.cameraIndex, e.target.value);
  };
  updateCameraRoom = e => {
    const newRoom = e.target.value === '' ? null : e.target.value;
    this.props.updateCameraField(this.props.cameraIndex, 'room_id', newRoom);
  };
  componentWillMount() {}

  // The camera on a phone (docs/specs/mobile-pages/integration-devices.md): a row and its sheet,
  // fed by the handlers of the card below.
  renderMobile(props, { lastError, testConnectionErrorMessage, tooMuchStatesError, statesNumber }) {
    const { camera, cameraIndex } = props;
    // the camera "+" just added, not saved yet: closing its sheet takes it out of the list
    const isDraft = !camera.created_at && Boolean(props.discardOnClose);
    const url = get(camera, 'cameraUrl.value');
    const rotation = get(camera, 'cameraRotation.value');
    const fieldId = `rtsp-camera-${cameraIndex}`;
    let saveError = null;
    if (lastError === 'save') {
      saveError = <Text id="integration.rtspCamera.saveError" />;
    } else if (lastError === 'test') {
      saveError = (
        <div>
          <Text id="integration.rtspCamera.testConnectionError" />
          {testConnectionErrorMessage && <div class={style.mobileErrorDetail}>{testConnectionErrorMessage}</div>}
        </div>
      );
    }
    return (
      <MobileDeviceItem
        device={camera}
        icon="camera"
        houses={props.housesWithRooms || []}
        onNameChange={this.updateCameraName}
        onRoomChange={this.updateCameraRoom}
        namePlaceholderId="integration.rtspCamera.namePlaceholder"
        // a camera needs a name to be saved
        nameInvalid={!camera.name}
        saveDisabled={!camera.name}
        extraSignature={[camera.poll_frequency, url || '', rotation]}
        onRevert={this.revertCamera}
        showFeatures={false}
        onSave={this.saveCamera}
        saveError={saveError}
        actions={[
          {
            label: <Text id="integration.rtspCamera.testConnectionButton" />,
            icon: 'video',
            onClick: this.testConnection,
            // the image of the test shows in the sheet
            keepOpen: true,
            dataCy: 'rtsp-camera-test'
          }
        ]}
        // it needs no "Delete". Any other camera has one, saved or not (one added on a wider
        // screen and not saved yet keeps its row: nothing is requested to delete it)
        onDelete={isDraft ? undefined : this.deleteCamera}
        deleteError={
          tooMuchStatesError ? (
            <MarkupText id="device.tooMuchStatesToDelete" fields={{ count: statesNumber }} />
          ) : (
            undefined
          )
        }
        autoOpen={props.autoOpen}
        onDismiss={isDraft ? this.discardCamera : undefined}
        dataCy="rtsp-camera-row"
      >
        <MobileField
          label={<Text id="integration.rtspCamera.pollFrequencyLabel" />}
          htmlFor={`${fieldId}-poll-frequency`}
        >
          <select
            id={`${fieldId}-poll-frequency`}
            class={fieldClass.select}
            onChange={this.updatePollFrequency}
            value={camera.poll_frequency}
            data-cy="rtsp-camera-poll-frequency"
          >
            {POLL_FREQUENCY_OPTIONS.map(option => (
              <option value={option.value}>
                <Text id={option.label} />
              </option>
            ))}
          </select>
        </MobileField>
        <MobileField
          label={<Text id="integration.rtspCamera.urlLabel" />}
          htmlFor={`${fieldId}-url`}
          help={<MarkupText id="integration.rtspCamera.urlExplanation" />}
        >
          <Localizer>
            <input
              id={`${fieldId}-url`}
              type="text"
              inputmode="url"
              class={fieldClass.input}
              value={url}
              onInput={this.updateCameraUrl}
              placeholder={<Text id="integration.rtspCamera.urlPlaceholder" />}
              autocomplete="off"
              autocapitalize="off"
              autocorrect="off"
              spellcheck={false}
              enterkeyhint="done"
              data-cy="rtsp-camera-url"
            />
          </Localizer>
        </MobileField>
        <MobileField label={<Text id="integration.rtspCamera.rotationLabel" />} htmlFor={`${fieldId}-rotation`}>
          <select
            id={`${fieldId}-rotation`}
            class={fieldClass.select}
            onChange={this.updateCameraRotation}
            value={rotation}
            data-cy="rtsp-camera-rotation"
          >
            {ROTATION_OPTIONS.map(option => (
              <option value={option.value}>
                <Text id={option.label} />
              </option>
            ))}
          </select>
        </MobileField>
        {camera.cameraImage && (
          <img
            class={style.mobilePreview}
            src={`data:${camera.cameraImage}`}
            alt={camera.name}
            data-cy="rtsp-camera-preview"
          />
        )}
      </MobileDeviceItem>
    );
  }

  render(props, { loading, saveError, testConnectionError, testConnectionErrorMessage }) {
    if (props.isMobile) {
      return this.renderMobile(props, this.state);
    }
    return (
      <div class="col-lg-6">
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
                  <select
                    className="form-control"
                    onChange={this.updateCameraRotation}
                    value={get(props, 'camera.cameraRotation.value')}
                  >
                    <option value={DEVICE_ROTATION.DEGREES_0}>
                      <Text id={`integration.rtspCamera.rotationO`} />
                    </option>
                    <option value={DEVICE_ROTATION.DEGREES_90}>
                      <Text id={`integration.rtspCamera.rotation90`} />
                    </option>
                    <option value={DEVICE_ROTATION.DEGREES_180}>
                      <Text id={`integration.rtspCamera.rotation18O`} />
                    </option>
                    <option value={DEVICE_ROTATION.DEGREES_270}>
                      <Text id={`integration.rtspCamera.rotation27O`} />
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <button onClick={this.testConnection} class="btn btn-info mr-2">
                    <Text id="integration.rtspCamera.testConnectionButton" />
                  </button>
                  <button onClick={this.saveCamera} class="btn btn-success mr-2">
                    <Text id="integration.rtspCamera.saveButton" />
                  </button>
                  <button onClick={this.deleteCamera} class="btn btn-danger mt-sm-0 mt-md-0 mt-lg-2 mt-xl-0">
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
