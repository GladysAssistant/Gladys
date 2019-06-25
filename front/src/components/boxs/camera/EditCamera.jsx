import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import actions from '../../../actions/dashboard/edit-boxes/editCamera';
import BaseEditBox from '../baseEditBox';

const EditCameraBox = ({ children, ...props }) => (
  <BaseEditBox {...props} titleKey="dashboard.boxTitle.camera">
    <div class="form-group">
      <label>
        <Text id="dashboard.boxes.camera.editCameraLabel" />
      </label>
      <select onChange={props.updateCamera} class="form-control">
        <option value="">-------</option>
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
  </BaseEditBox>
);

@connect(
  'cameras',
  actions
)
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

  componentDidMount() {
    this.props.getCameras();
  }

  render(props, {}) {
    return <EditCameraBox {...props} updateCamera={this.updateCamera} updateBoxName={this.updateBoxName} />;
  }
}

export default EditCameraBoxComponent;
