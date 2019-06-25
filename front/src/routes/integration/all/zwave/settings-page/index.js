import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import ZwavePage from '../ZwavePage';
import SettingsTab from './SettingsTab';
import integrationConfig from '../../../../../config/integrations';

@connect(
  'user,usbPorts,zwaveInfos,zwaveDriverPath',
  actions
)
class ZwaveSettingsPage extends Component {
  componentWillMount() {
    this.props.getUsbPorts();
    this.props.getInfos();
    this.props.getCurrentZwaveDriverPath();
  }

  render(props, {}) {
    return (
      <ZwavePage integration={integrationConfig[props.user.language].zwave}>
        <SettingsTab {...props} />
      </ZwavePage>
    );
  }
}

export default ZwaveSettingsPage;
