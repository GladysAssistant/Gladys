import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import BaseEditBox from '../baseEditBox';

const EditCameraBox = ({ children, ...props }) => (
  <BaseEditBox {...props} titleKey="dashboard.boxTitle.camera" titleValue={props.box.name}>
    <div class="form-group">
      <label>
        <Text id="dashboard.boxes.camera.editCameraLabel" />
      </label>
      <select onChange={props.updateCamera} class="form-control">
        <option value="">
          <Text id="global.emptySelectOption" />
        </option>
        {props.cameras &&
          props.cameras.map(camera => (
            <option selected={camera.selector === props.box.camera} value={camera.selector}>
              {camera.name}
            </option>
          ))}
      </select>
    </div>
    <div class="form-group">
      <label>
        <Text id="dashboard.boxes.camera.editBoxNameLabel" />
      </label>
      <Localizer>
        <input
          type="text"
          value={props.box.name}
          onInput={props.updateBoxName}
          class="form-control"
          placeholder={<Text id="dashboard.boxes.camera.editBoxNamePlaceholder" />}
        />
      </Localizer>
    </div>
    <div class="form-group">
      <label>
        <Text id="dashboard.boxes.camera.latencyBoxName" />
      </label>
      <select class="form-control" value={props.box.camera_latency} onInput={props.updateBoxLatency}>
        <option value="ultra-low">
          <Text id="dashboard.boxes.camera.latency.ultraLow" />
        </option>
        <option value="low">
          <Text id="dashboard.boxes.camera.latency.low" />
        </option>
        <option value="medium">
          <Text id="dashboard.boxes.camera.latency.medium" />
        </option>
        <option value="standard">
          <Text id="dashboard.boxes.camera.latency.standard" />
        </option>
      </select>
      <p>
        <small class="text-muted">
          <Text id="dashboard.boxes.camera.latencyBoxDescription" />
        </small>
      </p>
    </div>
    <div class="form-group">
      <label class="custom-switch">
        <input
          type="checkbox"
          id="cameraLiveAutoStart"
          name="cameraLiveAutoStart"
          class="custom-switch-input"
          checked={props.box.camera_live_auto_start}
          onClick={props.updateCameraLiveAutoStart}
        />
        <span class="custom-switch-indicator" />
        <span class="custom-switch-description">
          <Text id="dashboard.boxes.camera.liveAutoStartLabel" />
        </span>
      </label>
      <p class="mt-2">
        <small class="text-muted">
          <Text id="dashboard.boxes.camera.liveAutoStartDescription" />
        </small>
      </p>
    </div>
  </BaseEditBox>
);

class EditCameraBoxComponent extends Component {
  updateCamera = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      camera: e.target.value
    });
  };

  updateBoxName = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      name: e.target.value
    });
  };

  updateBoxLatency = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      camera_latency: e.target.value
    });
  };

  updateCameraLiveAutoStart = e => {
    const newValue = e.target.checked;
    console.log({ newValue });
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      camera_live_auto_start: newValue
    });
  };

  getCameras = async () => {
    await this.setState({
      loading: true
    });
    try {
      const cameras = await this.props.httpClient.get('/api/v1/camera');
      this.setState({
        cameras,
        loading: false
      });
    } catch (e) {
      this.setState({
        loading: false
      });
    }
  };

  initLatency = () => {
    if (!this.props.box.camera_latency) {
      this.props.updateBoxConfig(this.props.x, this.props.y, {
        camera_latency: 'low'
      });
    }
  };

  componentDidMount() {
    this.getCameras();
    this.initLatency();
  }

  render(props, { cameras }) {
    return (
      <EditCameraBox
        {...props}
        cameras={cameras}
        updateCamera={this.updateCamera}
        updateBoxName={this.updateBoxName}
        updateBoxLatency={this.updateBoxLatency}
        updateCameraLiveAutoStart={this.updateCameraLiveAutoStart}
      />
    );
  }
}

export default connect('httpClient', {})(EditCameraBoxComponent);
