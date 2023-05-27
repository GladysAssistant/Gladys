import { Component } from 'preact';
import { Link } from 'preact-router/match';
import { connect } from 'unistore/preact';
import actions from './actions';
import { Text } from 'preact-i18n';

class CheckStatus extends Component {
  componentWillMount() {
    this.props.getStatus();
  }

  render(props, {}) {
    let messageKey;
    let linkUrl = '';
    let linkText = '';
    if (!props.usbConfigured) {
      messageKey = 'integration.zwavejsui.status.notConfigured';
      linkUrl = '/dashboard/integration/device/zwave-js-ui/settings';
      linkText = 'integration.zwavejsui.status.settingsPageLink';
    } else if (!props.mqttExist) {
      messageKey = 'integration.zwavejsui.status.mqttNotInstalled';
    } else if (!props.mqttRunning) {
      messageKey = 'integration.zwavejsui.status.mqttNotRunning';
    } else if (!props.mqttConnected) {
      messageKey = 'integration.zwavejsui.status.gladysNotConnected';
    } else if (!props.zwaveJSUIExist) {
      messageKey = 'integration.zwavejsui.status.zwave-js-uiNotInstalled';
    } else if (!props.zwaveJSUIRunning) {
      messageKey = 'integration.zwavejsui.status.zwave-js-uiNotRunning';
    }

    return (
      <div class="alert alert-warning">
        <Text id={messageKey} />
        <Link href={linkUrl}>
          <Text id={linkText} />
        </Link>
      </div>
    );
  }
}

export default connect(
  'user,session,usbConfigured,mqttExist,mqttRunning,mqttConnected,zwaveJSUIExist,zwaveJSUIRunning',
  actions
)(CheckStatus);
