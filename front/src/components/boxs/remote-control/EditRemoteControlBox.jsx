import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import actions from '../../../actions/dashboard/edit-boxes/editRemoteControl';
import BaseEditBox from '../baseEditBox';
import RemoteControlSelector from '../../remote-control/RemoteControlSelector';

const EditRemoteControlBox = ({ children, ...props }) => (
  <BaseEditBox {...props} titleKey="dashboard.boxTitle.remote-control">
    <RemoteControlSelector
      updateRemoteTypeAndButtons={props.updateBoxRemoteControlType}
      remoteType={props.box.remoteType}
      dashboard
    />

    <div class="form-group">
      <label for="remoteDevice">
        <Text id="dashboard.boxes.remote-control.editRemoteControlDevice" />
      </label>

      <select onChange={props.updateRemoteControlDevice} class="form-control" disabled={!props.remoteDevices}>
        <option>
          <Text id="global.emptySelectOption" />
        </option>
        {props.remoteDevices &&
          props.remoteDevices.map(remote => (
            <option selected={remote.selector === props.box.remote} value={remote.selector}>
              {remote.name}
            </option>
          ))}
      </select>
    </div>
  </BaseEditBox>
);

@connect('DashboardRemoteControlStatusDevices,remoteDevices', actions)
class EditRemoteControlBoxComponent extends Component {
  updateBoxRemoteControlType = remoteType => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      remoteType
    });
    this.props.getRemoteControl(remoteType);
  };

  updateRemoteControlDevice = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      remote: e.target.value
    });
  };

  render(props, {}) {
    return (
      <EditRemoteControlBox
        {...props}
        updateBoxRemoteControlType={this.updateBoxRemoteControlType}
        updateRemoteControlDevice={this.updateRemoteControlDevice}
      />
    );
  }
}

export default EditRemoteControlBoxComponent;
