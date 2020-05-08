import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import actions from '../../../actions/dashboard/edit-boxes/editCamera';
import BaseEditBox from '../baseEditBox';
import Select from '../../form/Select';
import { RequestStatus } from '../../../utils/consts';

const EditCameraBox = ({ children, ...props }) => (
  <BaseEditBox {...props} titleKey="dashboard.boxTitle.camera">
    <div class="form-group">
      <label>
        <Text id="dashboard.boxes.camera.editCameraLabel" />
      </label>
      <Select
        onChange={props.updateCamera}
        value={props.box.camera}
        uniqueKey="selector"
        options={props.cameras}
        itemLabelKey="name"
        loading={props.DashboardEditCameraStatus === RequestStatus.Getting}
      />
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

@connect('cameras,DashboardEditCameraStatus', actions)
class EditCameraBoxComponent extends Component {
  updateCamera = camera => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      camera: camera.selector
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
