import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';

import actions from '../../../actions/dashboard/edit-boxes/editRemoteControl';
import BaseEditBox from '../baseEditBox';
import RemoteControlSelector from '../../remote-control/RemoteControlSelector';

const EditRemoteControlBox = ({ remoteDevices = [], box, ...props }) => (
  <BaseEditBox {...props} titleKey="dashboard.boxTitle.remote-control">
    <RemoteControlSelector updateRemoteType={props.updateBoxRemoteControlType} remoteType={box.remote} dashboard />

    <div class="form-group">
      <label for="remoteDevice">
        <Text id="dashboard.boxes.remote-control.editRemoteControlDevice" />
      </label>

      <select onChange={props.updateRemoteControlDevice} class="form-control" disabled={!box.remote}>
        <option>
          <Text id="global.emptySelectOption" />
        </option>
        {remoteDevices.map(remote => (
          <option selected={remote.selector === box.device} value={remote.selector}>
            {remote.name}
          </option>
        ))}
      </select>
    </div>
  </BaseEditBox>
);

@connect('DashboardRemoteControlStatusDevices,remoteDevices', actions)
class EditRemoteControlBoxComponent extends Component {
  updateBoxRemoteControlType = remote => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      remote
    });
    this.props.getRemoteControl(remote);
  };

  updateRemoteControlDevice = e => {
    const device = e.target.value;

    this.props.updateBoxConfig(this.props.x, this.props.y, {
      device
    });
  };

  render({ ...props }, {}) {
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
